from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List

from database import get_db
from models.user import User, RoleEnum
from models.student import Student
from models.marks import Marks
from auth.jwt_handler import get_current_user
from ml.predict import predict_grade
from ml.cluster import cluster_students

router = APIRouter()

# Dependency for Role Checking
def require_admin_or_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.admin, RoleEnum.teacher]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin/Teacher access required"
        )
    return current_user

class PredictRequest(BaseModel):
    mid_term: float
    assignment: float

class PredictResponse(BaseModel):
    predicted_grade: str
    confidence_percentage: float

# 3. POST /ml/predict-grade API route
@router.post("/predict-grade", response_model=PredictResponse)
def predict_student_grade_route(data: PredictRequest, current_user: User = Depends(get_current_user)):
    result = predict_grade(data.mid_term, data.assignment)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result

# 4. GET /ml/at-risk
@router.get("/at-risk")
def get_at_risk_students(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    # Group by student to get their total across all subjects
    student_totals = db.query(
        Student.id,
        Student.name,
        Student.class_name,
        func.sum(Marks.mid_term + Marks.final_term + Marks.assignment).label("total_marks"),
        func.count(Marks.id).label("subject_count")
    ).join(Marks, Student.id == Marks.student_id)\
     .group_by(Student.id).all()
     
    at_risk = []
    for st in student_totals:
        if st.subject_count == 0:
            continue
            
        # Max marks per subject is typically 100 (50+30+20 etc.) Let's assume 100 per subject.
        max_possible = st.subject_count * 100
        
        # Flag if total is < 50% of max possible
        if st.total_marks < (max_possible * 0.5):
            at_risk.append({
                "student_id": st.id,
                "name": st.name,
                "class_name": st.class_name,
                "total_marks": float(st.total_marks),
                "max_possible": max_possible,
                "percentage": round((float(st.total_marks) / max_possible) * 100, 2)
            })
            
    return at_risk

# 5. GET /ml/clusters
@router.get("/clusters")
def get_student_clusters(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    student_totals = db.query(
        Student.id,
        Student.name,
        func.sum(Marks.mid_term + Marks.final_term + Marks.assignment).label("total")
    ).join(Marks, Student.id == Marks.student_id)\
     .group_by(Student.id).all()
     
    data = []
    for st in student_totals:
        if st.total is not None:
             data.append({
                 "id": st.id,
                 "name": st.name,
                 "total": float(st.total)
             })
             
    if not data:
        return []
        
    clusters = cluster_students(data)
    return clusters

