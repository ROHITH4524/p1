from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
from models.user import User, RoleEnum
from models.student import Student
from models.marks import Marks
from models.subject import Subject
from auth.jwt_handler import get_current_user

router = APIRouter()

# Dependency for Role Checking
def require_admin_or_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.teacher]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Teacher access required"
        )
    return current_user

# Pydantic Schemas
class MarkAddRequest(BaseModel):
    student_id: int
    subject_id: int
    mid_term: float = 0
    final_term: float = 0
    assignment: float = 0

class MarkUpdateRequest(BaseModel):
    mid_term: Optional[float] = None
    final_term: Optional[float] = None
    assignment: Optional[float] = None

class MarkReportResponse(BaseModel):
    student_name: str
    class_name: str
    subject: str
    mid_term: float
    final_term: float
    assignment: float
    total: float
    grade: str

def calculate_grade(total: float) -> str:
    if total >= 90: return "A+"
    elif total >= 80: return "A"
    elif total >= 70: return "B"
    elif total >= 60: return "C"
    elif total >= 50: return "D"
    else: return "F"

# 1. POST /marks/add
@router.post("/add", status_code=status.HTTP_201_CREATED)
def add_marks(mark_data: MarkAddRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    # Verify student exists in same school
    student = db.query(Student).filter(Student.id == mark_data.student_id, Student.school_id == current_user.school_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found in your school")

    # Verify subject exists in same school
    subject = db.query(Subject).filter(Subject.id == mark_data.subject_id, Subject.school_id == current_user.school_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found in your school")

    total = mark_data.mid_term + mark_data.final_term + mark_data.assignment
    grade = calculate_grade(total)
    
    new_mark = Marks(
        student_id=mark_data.student_id,
        subject_id=mark_data.subject_id,
        school_id=current_user.school_id, # Link to school
        mid_term=mark_data.mid_term,
        final_term=mark_data.final_term,
        assignment=mark_data.assignment,
        grade=grade
    )
    db.add(new_mark)
    db.commit()
    db.refresh(new_mark)
    return new_mark

# 2. GET /marks/report
@router.get("/report", response_model=List[MarkReportResponse])
def get_marks_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(
        Student.name.label("student_name"),
        Student.class_name,
        Subject.name.label("subject"),
        Marks.mid_term,
        Marks.final_term,
        Marks.assignment,
        Marks.total,
        Marks.grade
    ).join(Marks, Student.id == Marks.student_id)\
     .join(Subject, Marks.subject_id == Subject.id)

    # Super Admin sees everything, others see only their school
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(Marks.school_id == current_user.school_id)

    # Teachers see only their own students
    if current_user.role == RoleEnum.teacher:
        from models.teacher import Teacher
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if teacher:
            query = query.filter(Student.teacher_id == teacher.id)

    # Students see only their own marks (already handled by school_id + student_id check if we wanted, but let's be explicit)
    if current_user.role == RoleEnum.student:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []
        query = query.filter(Marks.student_id == student.id)
        
    results = query.all()
    
    response = []
    for r in results:
        tot = float(r.total) if r.total is not None else float(r.mid_term + r.final_term + r.assignment)
        response.append({
            "student_name": r.student_name,
            "class_name": r.class_name,
            "subject": r.subject,
            "mid_term": float(r.mid_term),
            "final_term": float(r.final_term),
            "assignment": float(r.assignment),
            "total": tot,
            "grade": r.grade
        })
    return response

# 5. GET /marks/subject-average
@router.get("/subject-average")
def get_subject_average(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    query = db.query(
        Subject.name.label("subject"),
        func.avg(Marks.mid_term + Marks.final_term + Marks.assignment).label("avg_total")
    ).join(Marks, Subject.id == Marks.subject_id)
    
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(Marks.school_id == current_user.school_id)
        
    results = query.group_by(Subject.id).all()
    
    response = []
    for r in results:
        response.append({
            "subject": r.subject,
            "average": float(r.avg_total) if r.avg_total else 0.0
        })
    return response

# 3. GET /marks/student/{student_id}
@router.get("/student/{student_id}")
def get_student_marks(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Access Check
    if current_user.role != RoleEnum.super_admin:
        if student.school_id != current_user.school_id:
            raise HTTPException(status_code=403, detail="Not authorized to view marks of another school")
            
        if current_user.role == RoleEnum.teacher:
            from models.teacher import Teacher
            t = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
            if not t or student.teacher_id != t.id:
                raise HTTPException(status_code=403, detail="Not authorized to view this student")
        
        if current_user.role == RoleEnum.student:
            if student.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to view other students' marks")

    marks = db.query(Marks, Subject.name.label("subject_name")).join(Subject, Marks.subject_id == Subject.id).filter(Marks.student_id == student_id).all()
    
    result = []
    for m, subject_name in marks:
        tot = float(m.total) if m.total is not None else float(m.mid_term + m.final_term + m.assignment)
        result.append({
            "id": m.id,
            "subject_id": m.subject_id,
            "subject_name": subject_name,
            "mid_term": float(m.mid_term),
            "final_term": float(m.final_term),
            "assignment": float(m.assignment),
            "total": tot,
            "grade": m.grade
        })
    return result

# 4. PUT /marks/{mark_id}
@router.put("/{mark_id}")
def update_marks(mark_id: int, update_data: MarkUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    mark = db.query(Marks).filter(Marks.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mark not found")
    
    # Access check
    if current_user.role != RoleEnum.super_admin:
        if mark.school_id != current_user.school_id:
            raise HTTPException(status_code=403, detail="Not authorized to update marks of another school")
            
    if update_data.mid_term is not None: mark.mid_term = update_data.mid_term
    if update_data.final_term is not None: mark.final_term = update_data.final_term
    if update_data.assignment is not None: mark.assignment = update_data.assignment
    
    mt = float(mark.mid_term)
    ft = float(mark.final_term)
    assgn = float(mark.assignment)
    total = mt + ft + assgn
    mark.grade = calculate_grade(total)
    
    db.commit()
    db.refresh(mark)
    
    return mark

