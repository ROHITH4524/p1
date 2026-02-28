from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User, RoleEnum
from models.teacher import Teacher
from models.student import Student
from models.marks import Marks
from models.subject import Subject
from auth.jwt_handler import get_current_user, check_role, get_password_hash

router = APIRouter()

# Schemas
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    subject_specialization: str | None = None

class TeacherDeleteRequest(BaseModel):
    action: str # 'delete_students' or 'reassign'
    reassign_to_id: int | None = None

@router.post("/add-teacher", status_code=status.HTTP_201_CREATED)
def add_teacher(teacher: TeacherCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    
    db_user = db.query(User).filter(User.email == teacher.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        name=teacher.name,
        email=teacher.email,
        password_hash=get_password_hash(teacher.password),
        role=RoleEnum.teacher,
        school_id=current_user.school_id
    )
    db.add(new_user)
    db.flush() 
    
    new_teacher = Teacher(
        user_id=new_user.id,
        school_id=current_user.school_id,
        subject_specialization=teacher.subject_specialization
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    return {
        "message": "Teacher created successfully",
        "teacher_id": new_teacher.id,
        "credentials": {"email": teacher.email, "password": teacher.password}
    }

@router.get("/teachers")
def list_teachers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    
    results = db.query(
        Teacher.id,
        User.name,
        User.email,
        User.is_active,
        Teacher.subject_specialization,
        func.count(Student.id).label("student_count")
    ).join(User, Teacher.user_id == User.id)\
     .outerjoin(Student, Teacher.id == Student.teacher_id)\
     .filter(Teacher.school_id == current_user.school_id)\
     .group_by(Teacher.id).all()
     
    return [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "is_active": r.is_active,
            "subject": r.subject_specialization,
            "student_count": r.student_count
        } for r in results
    ]

@router.put("/toggle-teacher/{teacher_id}")
def toggle_teacher_active(teacher_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id, Teacher.school_id == current_user.school_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found in your school")
        
    user = db.query(User).filter(User.id == teacher.user_id).first()
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"Teacher account {'activated' if user.is_active else 'deactivated'} successfully", "is_active": user.is_active}

@router.delete("/teacher/{teacher_id}")
def delete_teacher(teacher_id: int, data: TeacherDeleteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id, Teacher.school_id == current_user.school_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found in your school")
        
    if data.action == "reassign":
        if not data.reassign_to_id:
            raise HTTPException(status_code=400, detail="Reassign ID required")
        target = db.query(Teacher).filter(Teacher.id == data.reassign_to_id, Teacher.school_id == current_user.school_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Target teacher not found")
        db.query(Student).filter(Student.teacher_id == teacher_id).update({"teacher_id": data.reassign_to_id})
    else:
        db.query(Student).filter(Student.teacher_id == teacher_id).delete()

    user_id = teacher.user_id
    db.delete(teacher)
    db.query(User).filter(User.id == user_id).delete()
    db.commit()
    
    return {"message": "Teacher removed and students handled successfully"}

@router.get("/students")
def list_all_students(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    results = db.query(
        Student.id,
        Student.name.label("student_name"),
        Student.class_name,
        User.name.label("teacher_name")
    ).join(Teacher, Student.teacher_id == Teacher.id)\
     .join(User, Teacher.user_id == User.id)\
     .filter(Student.school_id == current_user.school_id).all()
    return results

@router.get("/dashboard")
def get_school_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    sid = current_user.school_id
    
    total_teachers = db.query(Teacher).filter(Teacher.school_id == sid).count()
    total_students = db.query(Student).filter(Student.school_id == sid).count()
    
    avg_marks = db.query(func.avg(Marks.mid_term + Marks.final_term + Marks.assignment)).filter(Marks.school_id == sid).scalar()
    
    grade_dist_raw = db.query(Marks.grade, func.count(Marks.id)).filter(Marks.school_id == sid).group_by(Marks.grade).all()
    grade_dist = {g: count for g, count in grade_dist_raw}
    
    at_risk_count = db.query(Student.id).join(Marks, Student.id == Marks.student_id)\
        .filter(Student.school_id == sid)\
        .group_by(Student.id)\
        .having(func.avg(Marks.mid_term + Marks.final_term + Marks.assignment) < 50).count()
    
    top_performers = db.query(
        Student.name,
        func.avg(Marks.mid_term + Marks.final_term + Marks.assignment).label("avg_score")
    ).join(Marks, Student.id == Marks.student_id)\
     .filter(Student.school_id == sid)\
     .group_by(Student.id)\
     .order_by(func.avg(Marks.mid_term + Marks.final_term + Marks.assignment).desc())\
     .limit(5).all()

    # Teacher Performance (Class Average per Teacher)
    teacher_perf_raw = db.query(
        User.name,
        func.avg(Marks.total).label("avg_score")
    ).join(Teacher, User.id == Teacher.user_id)\
     .join(Student, Teacher.id == Student.teacher_id)\
     .join(Marks, Student.id == Marks.student_id)\
     .filter(Teacher.school_id == sid)\
     .group_by(Teacher.id).all()

    return {
        "total_teachers": total_teachers,
        "total_students": total_students,
        "average_marks": round(float(avg_marks), 2) if avg_marks else 0,
        "grade_distribution": grade_dist,
        "at_risk_count": at_risk_count,
        "top_performers": [{"name": p.name, "score": round(float(p.avg_score), 2)} for p in top_performers],
        "teacher_performance": [{"teacher_name": p.name, "avg_score": round(float(p.avg_score), 2)} for p in teacher_perf_raw]
    }

@router.get("/reports")
def get_school_marks_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.school_admin])
    results = db.query(
        Student.name.label("student"),
        Student.class_name,
        Subject.name.label("subject"),
        Marks.mid_term,
        Marks.final_term,
        Marks.assignment,
        Marks.total,
        Marks.grade,
        User.name.label("teacher")
    ).join(Marks, Student.id == Marks.student_id)\
     .join(Subject, Marks.subject_id == Subject.id)\
     .join(Teacher, Student.teacher_id == Teacher.id)\
     .join(User, Teacher.user_id == User.id)\
     .filter(Student.school_id == current_user.school_id).all()
    return results
