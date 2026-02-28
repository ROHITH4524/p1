from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from models.user import User, RoleEnum
from models.student import Student
from models.marks import Marks
from models.subject import Subject
from models.school import School
from models.teacher import Teacher
from auth.jwt_handler import get_current_user, check_role, get_password_hash
from ml.predict import predict_grade
from ml.cluster import cluster_students

router = APIRouter()

# Schemas
class PasswordChangeRequest(BaseModel):
    new_password: str

def calculate_grade(total_score: float) -> str:
    if total_score >= 90: return "A+"
    elif total_score >= 80: return "A"
    elif total_score >= 70: return "B"
    elif total_score >= 60: return "C"
    elif total_score >= 50: return "D"
    else: return "F"

@router.get("/my-marks")
def get_my_marks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.student])
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    marks = db.query(
        Subject.name.label("subject_name"),
        Marks.mid_term,
        Marks.final_term,
        Marks.assignment,
        Marks.total,
        Marks.grade
    ).join(Subject, Marks.subject_id == Subject.id)\
     .filter(Marks.student_id == student.id).all()
     
    return marks

@router.get("/my-dashboard")
def get_my_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.student])
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    marks = db.query(
        Subject.name.label("subject"),
        Marks.total
    ).join(Subject, Marks.subject_id == Subject.id)\
     .filter(Marks.student_id == student.id).all()
     
    if not marks:
        return {
            "average_marks": 0.0,
            "best_subject": "N/A",
            "weakest_subject": "N/A",
            "overall_grade": "N/A",
            "performance_tier": "N/A"
        }
    
    total_score = sum(float(m.total or 0) for m in marks)
    avg = total_score / len(marks)
    
    best = max(marks, key=lambda x: x.total or 0)
    weakest = min(marks, key=lambda x: x.total or 0)
    
    # ML Tiering
    all_students_in_school = db.query(
        Student.id,
        Student.name,
        func.avg(Marks.total).label("avg_total")
    ).join(Marks, Student.id == Marks.student_id)\
     .filter(Student.school_id == student.school_id)\
     .group_by(Student.id).all()
     
    cluster_data = [
        {"id": s.id, "name": s.name, "total": float(s.avg_total or 0)} 
        for s in all_students_in_school
    ]
    
    tier = "Unknown"
    if cluster_data:
        clusters = cluster_students(cluster_data)
        for c in clusters:
            if c["id"] == student.id:
                tier = c["performance_label"]
                break

    return {
        "average_marks": float(f"{avg:.2f}"),
        "best_subject": best.subject,
        "weakest_subject": weakest.subject,
        "overall_grade": calculate_grade(avg),
        "performance_tier": tier
    }

@router.get("/my-prediction")
def get_my_prediction(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.student])
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    marks = db.query(
        Subject.name.label("subject_name"),
        Marks.mid_term,
        Marks.assignment
    ).join(Subject, Marks.subject_id == Subject.id)\
     .filter(Marks.student_id == student.id).all()
     
    predictions = []
    for m in marks:
        pred = predict_grade(float(m.mid_term or 0), float(m.assignment or 0))
        predictions.append({
            "subject": m.subject_name,
            "predicted_grade": pred.get("predicted_grade", "N/A"),
            "confidence": pred.get("confidence_percentage", 0)
        })
        
    return predictions

@router.post("/change-password")
def change_my_password(data: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/my-report-pdf")
def get_my_report_pdf_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.student])
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    teacher_user = db.query(User).join(Teacher, User.id == Teacher.user_id).filter(Teacher.id == student.teacher_id).first()
    school = db.query(School).filter(School.id == student.school_id).first()
    
    marks_data = db.query(
        Subject.name.label("subject"),
        Marks.mid_term,
        Marks.final_term,
        Marks.assignment,
        Marks.total,
        Marks.grade
    ).join(Subject, Marks.subject_id == Subject.id)\
     .filter(Marks.student_id == student.id).all()
     
    return {
        "student_name": student.name,
        "class": student.class_name,
        "teacher": teacher_user.name if teacher_user else "Unknown",
        "school": school.name if school else "Unknown",
        "results": [
            {
                "subject": r.subject,
                "mid_term": float(r.mid_term),
                "final_term": float(r.final_term),
                "assignment": float(r.assignment),
                "total": float(r.total),
                "grade": r.grade
            } for r in marks_data
        ]
    }
