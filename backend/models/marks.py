from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, FetchedValue
from database import Base

class Marks(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    mid_term = Column(DECIMAL(5, 2), default=0)
    final_term = Column(DECIMAL(5, 2), default=0)
    assignment = Column(DECIMAL(5, 2), default=0)
    # total is a generated column in MySQL, usually handled automatically
    total = Column(DECIMAL(5, 2), server_default=FetchedValue()) 
    grade = Column(String(10))
