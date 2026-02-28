from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
