from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    subject_specialization = Column(String(100))
