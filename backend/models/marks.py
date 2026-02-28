from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, DateTime, func
from database import Base

class Marks(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    mid_term = Column(DECIMAL(5, 2), default=0)
    final_term = Column(DECIMAL(5, 2), default=0)
    assignment = Column(DECIMAL(5, 2), default=0)
    total = Column(DECIMAL(5, 2), default=0)
    grade = Column(String(2))
    created_at = Column(DateTime, server_default=func.now())
