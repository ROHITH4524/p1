from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Boolean, DateTime, func
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    school_admin = "school_admin"
    teacher = "teacher"
    student = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_default_password = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
