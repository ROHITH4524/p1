import io
import csv
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr

from database import get_db
from models.user import User, RoleEnum
from models.student import Student
from auth.jwt_handler import get_current_user, get_password_hash

router = APIRouter()

# Dependency for Role Checking
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_admin_or_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.admin, RoleEnum.teacher]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Teacher access required"
        )
    return current_user

# Pydantic Schemas
class StudentAddRequest(BaseModel):
    name: str
    age: int
    gender: str
    class_name: str
    email: EmailStr
    password: str

class StudentUpdateRequest(BaseModel):
    name: str = None
    age: int = None
    gender: str = None
    class_name: str = None

class StudentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    age: int
    gender: str
    class_name: str

    class Config:
        from_attributes = True

# 1. POST /students/add (Admin only)
@router.post("/add", status_code=status.HTTP_201_CREATED, response_model=StudentResponse)
def add_student(student_data: StudentAddRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Check if email exists
    if db.query(User).filter(User.email == student_data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    try:
        # Step 1: Create user
        new_user = User(
            name=student_data.name,
            email=student_data.email,
            password_hash=get_password_hash(student_data.password),
            role=RoleEnum.student
        )
        db.add(new_user)
        db.flush() # Get user ID before commit

        # Step 3: Create student
        new_student = Student(
            user_id=new_user.id,
            name=student_data.name,
            age=student_data.age,
            gender=student_data.gender,
            class_name=student_data.class_name
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        return new_student
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. GET /students/all (Admin and Teacher only)
@router.get("/all")
def get_all_students(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    students = db.query(
        Student.id, 
        Student.name, 
        Student.age, 
        Student.gender, 
        Student.class_name,
        User.email
    ).join(User, Student.user_id == User.id).all()
    
    result = []
    for s in students:
        result.append({
            "id": s.id,
            "name": s.name,
            "age": s.age,
            "gender": s.gender,
            "class_name": s.class_name,
            "email": s.email
        })
    return result

# 3. GET /students/{student_id}
@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student

# 4. PUT /students/{student_id}
@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, update_data: StudentUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_teacher)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Update fields that were provided
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(student, key, value)
        
    db.commit()
    db.refresh(student)
    return student

# 5. DELETE /students/{student_id}
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Needs to delete User, which cascades to Student and Marks due to schema
    user = db.query(User).filter(User.id == student.user_id).first()
    if user:
        db.delete(user)
    else:
        db.delete(student) # Fallback if user doesn't exist
        
    db.commit()
    return None

# 6. POST /students/upload-csv
@router.post("/upload-csv")
async def upload_students_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a CSV")
        
    content = await file.read()
    decoded = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    # Verify required columns exist
    required_cols = {"name", "age", "gender", "class", "email", "password"}
    if not required_cols.issubset(set(csv_reader.fieldnames)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"CSV must contain columns: {', '.join(required_cols)}"
        )
        
    import_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=1):
        try:
            # Check if email exists
            if db.query(User).filter(User.email == row["email"]).first():
                errors.append(f"Row {row_num}: Email {row['email']} already exists. Skipped.")
                continue
                
            # Step 1: Create user
            new_user = User(
                name=row["name"],
                email=row["email"],
                password_hash=get_password_hash(row["password"]),
                role=RoleEnum.student
            )
            db.add(new_user)
            db.flush()
            
            # Step 2: Create student
            new_student = Student(
                user_id=new_user.id,
                name=row["name"],
                age=int(row["age"]),
                gender=row["gender"],
                class_name=row["class"]
            )
            db.add(new_student)
            
            import_count += 1
        except Exception as e:
            db.rollback()
            errors.append(f"Row {row_num}: Error - {str(e)}")
            continue
            
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database commit error: {str(e)}")
        
    return {
        "message": f"Successfully imported {import_count} students.",
        "errors": errors
    }

