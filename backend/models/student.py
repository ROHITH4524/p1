from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(50))
    class_name = Column("class", String(50))
