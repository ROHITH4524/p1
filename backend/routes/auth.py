from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User, RoleEnum
from models.teacher import Teacher
from models.student import Student
from auth.jwt_handler import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

# Pydantic Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum
    school_id: int | None = None
    is_active: bool
    is_default_password: bool = False

    class Config:
        from_attributes = True

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # Authenticate user
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    # Get teacher_id if applicable
    teacher_id = None
    if user.role == RoleEnum.teacher:
        teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
        if teacher:
            teacher_id = teacher.id
    elif user.role == RoleEnum.student:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            teacher_id = student.teacher_id

    # Create token containing user ID, role, school_id, and teacher_id
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value,
            "school_id": user.school_id,
            "teacher_id": teacher_id
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    # For students, default password is their name
    # We check if the password hash matches their name
    is_default = verify_password(current_user.name, current_user.password_hash)
    
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        school_id=current_user.school_id,
        is_active=current_user.is_active,
        is_default_password=is_default
    )

@router.post("/change-password")
def change_password(data: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
