from database import SessionLocal
from models.user import User
from models.teacher import Teacher
from models.student import Student
from models.marks import Marks
from models.subject import Subject
from models.school import School
import traceback

def diag_add_marks():
    db = SessionLocal()
    try:
        # Get a teacher
        teacher_user = db.query(User).filter(User.role == 'teacher').first()
        teacher_profile = db.query(Teacher).filter(Teacher.user_id == teacher_user.id).first()
        
        # Get a student of this teacher
        student = db.query(Student).filter(Student.teacher_id == teacher_profile.id).first()
        
        # Get a subject
        subject = db.query(Subject).filter(Subject.school_id == teacher_user.school_id).first()
        
        print(f"Teacher: {teacher_user.name}, Student: {student.name}, Subject: {subject.name}")
        
        # Simulated logic from teacher.py
        mid = 45.0
        final = 48.0
        assign = 42.0
        total = mid + final + assign
        
        # The calculate_grade function logic
        if total >= 135: grade = 'A+'
        elif total >= 120: grade = 'A'
        elif total >= 105: grade = 'B'
        elif total >= 90: grade = 'C'
        elif total >= 75: grade = 'D'
        else: grade = 'F'
        
        print("Inserting mark...")
        new_mark = Marks(
            student_id=student.id,
            subject_id=subject.id,
            school_id=teacher_user.school_id,
            mid_term=mid,
            final_term=final,
            assignment=assign,
            grade=grade
        )
        db.add(new_mark)
        db.commit()
        print("✅ Simluated Insertion Success!")

    except Exception as e:
        print("❌ SIMULATED INSERTION FAILED")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diag_add_marks()
