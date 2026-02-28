from database import SessionLocal
from models.user import User
from models.teacher import Teacher
from models.student import Student
from models.marks import Marks
from models.subject import Subject
import traceback

def diag_teacher():
    db = SessionLocal()
    try:
        # Get the first teacher in the DB
        teacher_user = db.query(User).filter(User.role == 'teacher').first()
        if not teacher_user:
            print("❌ No teachers found")
            return
            
        print(f"Testing Teacher Dashboard for: {teacher_user.name} ({teacher_user.email})")
        
        teacher_profile = db.query(Teacher).filter(Teacher.user_id == teacher_user.id).first()
        if not teacher_profile:
            print("❌ No teacher profile found")
            return
            
        print(f"Teacher Profile ID: {teacher_profile.id}")
        
        # Test Query
        print("Executing report query...")
        report = db.query(
            Student.name.label("student_name"),
            Subject.name.label("subject"),
            Marks.mid_term,
            Marks.final_term,
            Marks.assignment,
            Marks.total,
            Marks.grade
        ).join(Marks, Student.id == Marks.student_id)\
         .join(Subject, Marks.subject_id == Subject.id)\
         .filter(Student.teacher_id == teacher_profile.id).all()
        
        print(f"✅ Success! Found {len(report)} marks records.")
        if len(report) > 0:
            print(f"Data preview: {report[0]}")

    except Exception as e:
        print("❌ TEACHER DIAGNOSTIC FAILED")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diag_teacher()
