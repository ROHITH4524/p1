from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models.user import User, RoleEnum
from models.student import Student
from models.marks import Marks
from models.teacher import Teacher
from models.subject import Subject
from auth.jwt_handler import get_current_user, check_role
from ml.predict import predict_grade
from ml.cluster import cluster_students

router = APIRouter()

# Schemas
class PredictRequest(BaseModel):
    mid_term: float
    assignment: float

class PredictResponse(BaseModel):
    predicted_grade: str
    confidence_percentage: float

class AtRiskStudent(BaseModel):
    student_name: str
    class_name: str
    total_marks: float
    teacher_name: str

# 1. POST /ml/predict-grade
@router.post("/predict-grade", response_model=PredictResponse)
def predict_student_grade_route(data: PredictRequest, current_user: User = Depends(get_current_user)):
    check_role(current_user, [RoleEnum.teacher, RoleEnum.student])
    result = predict_grade(data.mid_term, data.assignment)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result

# 2. GET /ml/at-risk
@router.get("/at-risk", response_model=List[AtRiskStudent])
def get_at_risk_students(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_role(current_user, [RoleEnum.school_admin, RoleEnum.teacher])
    
    query = db.query(
        Student.name.label("student_name"),
        Student.class_name,
        func.sum(Marks.total).label("total_marks"),
        User.name.label("teacher_name")
    ).join(Marks, Student.id == Marks.student_id)\
     .join(Teacher, Student.teacher_id == Teacher.id)\
     .join(User, Teacher.user_id == User.id)

    # Multi-tenant Isolation
    query = query.filter(Student.school_id == current_user.school_id)

    if current_user.role == RoleEnum.teacher:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if teacher:
            query = query.filter(Student.teacher_id == teacher.id)

    student_totals = query.group_by(Student.id).all()
    
    at_risk = []
    for st in student_totals:
        # At-risk = total marks below 50% of maximum (150 total max as per user request)
        if float(st.total_marks or 0) < 75: 
            at_risk.append({
                "student_name": st.student_name,
                "class_name": st.class_name,
                "total_marks": float(st.total_marks),
                "teacher_name": st.teacher_name
            })
            
    return at_risk

# 3. GET /ml/clusters
@router.get("/clusters")
def get_student_clusters(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_role(current_user, [RoleEnum.school_admin, RoleEnum.teacher])
    
    query = db.query(
        Student.id,
        Student.name,
        func.avg(Marks.total).label("avg_marks")
    ).join(Marks, Student.id == Marks.student_id)\
     .filter(Student.school_id == current_user.school_id)

    if current_user.role == RoleEnum.teacher:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if teacher:
            query = query.filter(Student.teacher_id == teacher.id)

    results = query.group_by(Student.id).all()
    
    if not results:
        return []

    # Map to High/Medium/Low by avg marks using KMeans in cluster_students
    data = [{"id": r.id, "name": r.name, "total": float(r.avg_marks or 0)} for r in results]
    clusters = cluster_students(data)
    return clusters

# 4. GET /ml/school-insights
@router.get("/school-insights")
def get_school_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_role(current_user, [RoleEnum.school_admin])
    
    school_id = current_user.school_id
    
    # Lowest Average Subject
    lowest_sub = db.query(
        Subject.name,
        func.avg(Marks.total).label("avg_score")
    ).join(Marks, Subject.id == Marks.subject_id)\
     .filter(Subject.school_id == school_id)\
     .group_by(Subject.id).order_by("avg_score").first()

    # Teacher whose students perform best
    best_teacher = db.query(
        User.name,
        func.avg(Marks.total).label("avg_score")
    ).join(Teacher, User.id == Teacher.user_id)\
     .join(Student, Teacher.id == Student.teacher_id)\
     .join(Marks, Student.id == Marks.student_id)\
     .filter(Teacher.school_id == school_id)\
     .group_by(Teacher.id).order_by(func.avg(Marks.total).desc()).first()

    # Month-wise performance trend
    trend = db.query(
        extract('month', Marks.created_at).label("month"),
        func.avg(Marks.total).label("avg_score")
    ).filter(Marks.school_id == school_id)\
     .group_by("month").all()
    
    # Grade distribution pie chart data
    grade_dist = db.query(
        Marks.grade,
        func.count(Marks.id).label("count")
    ).filter(Marks.school_id == school_id)\
     .group_by(Marks.grade).all()

    return {
        "lowest_subject": lowest_sub.name if lowest_sub else "N/A",
        "best_teacher": best_teacher.name if best_teacher else "N/A",
        "performance_trend": [{"month": int(t.month), "score": float(t.avg_score or 0)} for t in trend if t.month is not None],
        "grade_distribution": [{"grade": g.grade, "count": g.count} for g in grade_dist]
    }

