from sqlalchemy import Column, Integer, String, TEXT, DateTime, ForeignKey, func
from database import Base

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(TEXT)
    email = Column(String(255))
    phone = Column(String(20))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
