import random
import bcrypt
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User, RoleEnum
from models.student import Student
from models.marks import Marks
from models.subject import Subject
import traceback

db = SessionLocal()

first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Peyton", "Cameron", "Quinn", "Skyler", "Dakota", "Reese", "Rowan", "Hayden", "Emerson", "Finley", "Dylan", "Micah", "Logan", "Hunter", "Parker", "Blake", "Sawyer", "Ashton", "River", "Phoenix", "Kai", "Sloan"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

classes = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"]
genders = ["Male", "Female", "Non-binary", "Other"]

print("Starting to seed 100 students...")

try:
    for i in range(100):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        # Append i to ensure unique names and emails
        name = f"{name} {i}"
        
        # User requested password to be the same as the name
        password = name
        email = f"{name.replace(' ', '').lower()}@school.edu"
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        new_user = User(
            name=name,
            email=email,
            password_hash=hashed_password,
            role=RoleEnum.student
        )
        db.add(new_user)
        db.flush() # flush to get an ID without committing the whole transaction yet
        
        new_student = Student(
            user_id=new_user.id,
            name=name,
            age=random.randint(14, 18),
            gender=random.choice(genders),
            class_name=random.choice(classes)
        )
        db.add(new_student)
        db.flush()
        
        # Generate Marks to create distinct student ML clusters
        perf = random.choice(["high", "medium", "low"])
        # Subject IDs: let's assume 1 (Math), 2 (Science), 3 (English)
        for subject_id in [1, 2, 3]:
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
            
            # calculate grade
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
                mid_term=round(mid, 2),
                final_term=round(final, 2),
                assignment=round(assign, 2),
                grade=grade
            )
            db.add(new_mark)

    db.commit()
    print("Successfully seeded 100 random students with generated ML cluster data!")
except Exception as e:
    db.rollback()
    print(f"Error seeding data: {e}")
    traceback.print_exc()
finally:
    db.close()
