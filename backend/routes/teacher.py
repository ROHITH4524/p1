from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import csv
import io
from database import get_db
from models.user import User, RoleEnum
from models.teacher import Teacher
from models.student import Student
from models.marks import Marks
from models.subject import Subject
from auth.jwt_handler import get_current_user, check_role, get_password_hash

router = APIRouter()

# Schemas
class StudentCreate(BaseModel):
    name: str 
    age: int | None = None
    gender: str | None = None
    class_name: str | None = None

class MarkAddRequest(BaseModel):
    student_id: int
    subject_id: int
    mid_term: float
    final_term: float
    assignment: float

def calculate_grade(total):
    if total >= 90: return "A+"
    elif total >= 80: return "A"
    elif total >= 70: return "B"
    elif total >= 60: return "C"
    elif total >= 50: return "D"
    else: return "F"

@router.post("/add-student", status_code=status.HTTP_201_CREATED)
def add_student(student_data: StudentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")

    email = student_data.name.lower().replace(" ", "") + "@school.com"
    password = student_data.name # full name as-is
    
    # Check email collision
    if db.query(User).filter(User.email == email).first():
        count = db.query(User).filter(User.email.like(f"{email.split('@')[0]}%")).count()
        email = f"{email.split('@')[0]}{count}@school.com"

    new_user = User(
        name=student_data.name,
        email=email,
        password_hash=get_password_hash(password),
        role=RoleEnum.student,
        school_id=current_user.school_id
    )
    db.add(new_user)
    db.flush()
    
    new_student = Student(
        user_id=new_user.id,
        teacher_id=teacher.id,
        school_id=current_user.school_id,
        name=student_data.name,
        age=student_data.age,
        gender=student_data.gender,
        class_name=student_data.class_name
    )
    db.add(new_student)
    db.commit()
    
    return {
        "student_name": student_data.name,
        "login_email": email,
        "login_password": password,
        "message": "Student created successfully"
    }

@router.post("/add-students-csv")
async def add_students_csv(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")
        
    content = await file.read()
    decoded = content.decode("utf-8")
    io_string = io.StringIO(decoded)
    reader = csv.DictReader(io_string)
    
    creds = []
    created_count = 0
    
    for row in reader:
        name = row.get("name")
        if not name: continue
        
        email = name.lower().replace(" ", "") + "@school.com"
        password = name
        
        # Simple collision check
        if db.query(User).filter(User.email == email).first():
            email = f"{name.lower().replace(' ', '')}{created_count + 1}@school.com"

        new_user = User(
            name=name,
            email=email,
            password_hash=get_password_hash(password),
            role=RoleEnum.student,
            school_id=current_user.school_id
        )
        db.add(new_user)
        db.flush()
        
        new_student = Student(
            user_id=new_user.id,
            teacher_id=teacher.id,
            school_id=current_user.school_id,
            name=name,
            age=int(row.get("age", 0)) if row.get("age") else None,
            gender=row.get("gender"),
            class_name=row.get("class")
        )
        db.add(new_student)
        creds.append({"name": name, "email": email, "password": password})
        created_count += 1
    
    db.commit()
    return {"created_count": created_count, "credentials": creds}

@router.get("/my-students")
def get_my_students(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        return []
    
    # Query students + average of their marks to determine tier
    results = db.query(
        Student.id,
        Student.name,
        Student.class_name,
        func.sum(Marks.total).label("total_marks"),
        func.avg(Marks.total).label("avg_marks")
    ).outerjoin(Marks, Student.id == Marks.student_id)\
     .filter(Student.teacher_id == teacher.id)\
     .group_by(Student.id).all()
     
    students = []
    for r in results:
        avg = float(r.avg_marks) if r.avg_marks else 0
        grade = calculate_grade(avg)
        tier = "Top" if avg >= 80 else "Average" if avg >= 50 else "At-Risk"
        students.append({
            "id": r.id,
            "name": r.name,
            "class_name": r.class_name,
            "total_marks": float(r.total_marks) if r.total_marks else 0,
            "grade": grade,
            "performance_tier": tier
        })
    return students

@router.put("/student/{student_id}")
def update_student(student_id: int, student_data: StudentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == teacher.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not assigned to you")
    
    student.name = student_data.name
    student.age = student_data.age
    student.gender = student_data.gender
    student.class_name = student_data.class_name
    db.commit()
    return {"message": "Student updated successfully"}

@router.delete("/student/{student_id}")
def delete_student(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == teacher.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not assigned to you")
    
    user_id = student.user_id
    db.delete(student)
    db.query(User).filter(User.id == user_id).delete()
    db.commit()
    return {"message": "Student and associated user account removed successfully"}

@router.post("/add-marks")
def add_marks(data: MarkAddRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    
    student = db.query(Student).filter(Student.id == data.student_id, Student.teacher_id == teacher.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not assigned to you")
    
    total = data.mid_term + data.final_term + data.assignment
    grade = calculate_grade(total)
    
    new_mark = Marks(
        student_id=data.student_id,
        subject_id=data.subject_id,
        school_id=current_user.school_id,
        mid_term=data.mid_term,
        final_term=data.final_term,
        assignment=data.assignment,
        grade=grade
    )
    db.add(new_mark)
    db.commit()
    return {"message": "Marks added successfully", "grade": grade}

@router.get("/my-report")
def get_teacher_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        return []
        
    report = db.query(
        Student.name.label("student_name"),
        Subject.name.label("subject"),
        Marks.mid_term,
        Marks.final_term,
        Marks.assignment,
        Marks.total,
        Marks.grade
    ).join(Marks, Student.id == Marks.student_id)\
     .join(Subject, Marks.subject_id == Subject.id)\
     .filter(Student.teacher_id == teacher.id).all()
     
    # Convert Decimals to Float and Rows to Dicts for JSON serialization
    return [
        {
            "student_name": r.student_name,
            "subject": r.subject,
            "mid_term": float(r.mid_term or 0),
            "final_term": float(r.final_term or 0),
            "assignment": float(r.assignment or 0),
            "total": float(r.total or 0),
            "grade": r.grade
        } for r in report
    ]

@router.get("/subjects")
def get_teacher_subjects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.teacher])
    subjects = db.query(Subject).filter(Subject.school_id == current_user.school_id).all()
    return subjects
