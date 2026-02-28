import random
import bcrypt
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User, RoleEnum
from models.student import Student
from models.marks import Marks
from models.subject import Subject
from models.school import School
from models.teacher import Teacher
import traceback

db = SessionLocal()

first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Peyton", "Cameron", "Quinn", "Skyler", "Dakota", "Reese", "Rowan", "Hayden", "Emerson", "Finley", "Dylan", "Micah", "Logan", "Hunter", "Parker", "Blake", "Sawyer", "Ashton", "River", "Phoenix", "Kai", "Sloan"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

classes = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"]
genders = ["Male", "Female", "Non-binary", "Other"]

print("Starting to seed 100 students for the multi-tenant system...")

try:
    # Ensure at least one school and teacher exists
    school = db.query(School).first()
    if not school:
        school = School(name="Default Seed School", address="123 Seed Ave")
        db.add(school)
        db.flush()
        
    teacher = db.query(Teacher).first()
    if not teacher:
        # Create a teacher user
        teacher_user = User(
            name="Seed Teacher",
            email="teacher@seed.com",
            password_hash=bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role=RoleEnum.teacher,
            school_id=school.id
        )
        db.add(teacher_user)
        db.flush()
        teacher = Teacher(user_id=teacher_user.id, school_id=school.id, subject_specialization="General")
        db.add(teacher)
        db.flush()

    for i in range(100):
        name = f"{random.choice(first_names)} {random.choice(last_names)} {i}"
        password = name
        email = f"{name.replace(' ', '').lower()}@school.edu"
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        new_user = User(
            name=name,
            email=email,
            password_hash=hashed_password,
            role=RoleEnum.student,
            school_id=school.id
        )
        db.add(new_user)
        db.flush()
        
        new_student = Student(
            user_id=new_user.id,
            teacher_id=teacher.id,
            school_id=school.id,
            name=name,
            age=random.randint(14, 18),
            gender=random.choice(genders),
            class_name=random.choice(classes)
        )
        db.add(new_student)
        db.flush()
        
        perf = random.choice(["high", "medium", "low"])
        for subject_id in [1, 2, 3]:
            # Ensure subjects exist for this school
            sub = db.query(Subject).filter(Subject.id == subject_id).first()
            if not sub:
                sub_name = ["Math", "Science", "English"][subject_id-1]
                sub = Subject(id=subject_id, name=sub_name, school_id=school.id)
                db.add(sub)
                db.flush()

            if perf == "high":
                mid = random.uniform(35, 50)
                final = random.uniform(40, 50)
                assign = random.uniform(15, 20)
            elif perf == "medium":
                mid = random.uniform(25, 35)
                final = random.uniform(25, 40)
                assign = random.uniform(10, 15)
            else:
                mid = random.uniform(5, 25)
                final = random.uniform(10, 25)
                assign = random.uniform(0, 10)
            
            total = mid + final + assign
            if total >= 90: grade = 'A+'
            elif total >= 80: grade = 'A'
            elif total >= 70: grade = 'B'
            elif total >= 60: grade = 'C'
            elif total >= 50: grade = 'D'
            else: grade = 'F'
                
            new_mark = Marks(
                student_id=new_student.id,
                subject_id=subject_id,
                school_id=school.id,
                mid_term=float(f"{mid:.2f}"),
                final_term=float(f"{final:.2f}"),
                assignment=float(f"{assign:.2f}"),
                grade=grade
            )
            db.add(new_mark)

    db.commit()
    print("Successfully seeded 100 students with hierarchical multi-tenant data!")
except Exception as e:
    db.rollback()
    print(f"Error seeding data: {e}")
    traceback.print_exc()
finally:
    db.close()
