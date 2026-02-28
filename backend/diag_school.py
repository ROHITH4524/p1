from database import SessionLocal
from sqlalchemy import func
from models.user import User
from models.teacher import Teacher
from models.student import Student
from models.marks import Marks
import traceback

def diag():
    db = SessionLocal()
    try:
        sid = 1
        print(f"Testing School Admin Dashboard data for School ID: {sid}")
        
        # Test basic counts
        teachers = db.query(Teacher).filter(Teacher.school_id == sid).count()
        students = db.query(Student).filter(Student.school_id == sid).count()
        print(f"Teachers: {teachers}, Students: {students}")
        
        # Test Average Marks
        avg_marks = db.query(func.avg(Marks.mid_term + Marks.final_term + Marks.assignment)).filter(Marks.school_id == sid).scalar()
        print(f"Avg Marks: {avg_marks}")
        
        # Test Grade Distribution
        grade_dist = db.query(Marks.grade, func.count(Marks.id)).filter(Marks.school_id == sid).group_by(Marks.grade).all()
        print(f"Grade Dist: {grade_dist}")
        
        # Test Teacher Performance
        print("Testing teacher performance query...")
        teacher_perf_raw = db.query(
            User.name,
            func.avg(Marks.mid_term + Marks.final_term + Marks.assignment).label("avg_score")
        ).join(Teacher, User.id == Teacher.user_id)\
         .join(Student, Teacher.id == Student.teacher_id)\
         .join(Marks, Student.id == Marks.student_id)\
         .filter(Teacher.school_id == sid)\
         .group_by(Teacher.id).all()
        print(f"Teacher Perf: {teacher_perf_raw}")

    except Exception as e:
        print("❌ DIAGNOSTIC FAILED")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diag()
