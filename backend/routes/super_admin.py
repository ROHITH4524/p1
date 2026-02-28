from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User, RoleEnum
from models.school import School
from models.teacher import Teacher
from models.student import Student
from auth.jwt_handler import get_current_user, check_role, get_password_hash

router = APIRouter()

# Schemas
class SchoolCreate(BaseModel):
    name: str
    address: str | None = None
    email: EmailStr | None = None
    phone: str | None = None

class SchoolAdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    school_id: int

class DeleteConfirmation(BaseModel):
    confirm: bool

@router.post("/add-school", status_code=status.HTTP_201_CREATED)
def add_school(school: SchoolCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    new_school = School(**school.dict())
    db.add(new_school)
    db.commit()
    db.refresh(new_school)
    return {
        "message": "School created successfully",
        "school": new_school
    }

@router.get("/schools")
def list_schools(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    schools = db.query(School).all()
    results = []
    for s in schools:
        teacher_count = db.query(Teacher).filter(Teacher.school_id == s.id).count()
        student_count = db.query(Student).filter(Student.school_id == s.id).count()
        results.append({
            "id": s.id,
            "name": s.name,
            "address": s.address,
            "email": s.email,
            "phone": s.phone,
            "teacher_count": teacher_count,
            "student_count": student_count
        })
    return results

@router.delete("/school/{school_id}")
def delete_school(school_id: int, data: DeleteConfirmation, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    if not data.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to delete school")
        
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    db.delete(school)
    db.commit()
    return {"message": f"School and all associated data deleted successfully"}

@router.post("/add-school-admin", status_code=status.HTTP_201_CREATED)
def add_school_admin(admin: SchoolAdminCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    school = db.query(School).filter(School.id == admin.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    db_user = db.query(User).filter(User.email == admin.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        name=admin.name,
        email=admin.email,
        password_hash=get_password_hash(admin.password),
        role=RoleEnum.school_admin,
        school_id=admin.school_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "School Admin created successfully",
        "credentials": {
            "email": admin.email,
            "password": admin.password,
            "school": school.name
        }
    }

@router.get("/all-users")
def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    users = db.query(User, School.name.label("school_name"))\
        .outerjoin(School, User.school_id == School.id).all()
        
    # Grouping by school
    grouped = {}
    for u, school_name in users:
        s_name = school_name or "Platform"
        if s_name not in grouped:
            grouped[s_name] = []
        grouped[s_name].append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active
        })
    return grouped

@router.put("/toggle-user/{user_id}")
def toggle_user_status(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}
@router.get("/dashboard")
def get_super_admin_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, [RoleEnum.super_admin])
    
    total_schools = db.query(School).count()
    total_teachers = db.query(Teacher).count()
    total_students = db.query(Student).count()
    
    # Recent activity or other stats can be added here
    return {
        "total_schools": total_schools,
        "total_teachers": total_teachers,
        "total_students": total_students
    }
