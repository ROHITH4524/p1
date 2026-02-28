from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import urllib.parse

# Update password to 'Rohith@4524' and url-encode it because of the @ symbol
encoded_password = urllib.parse.quote_plus("Rohith@4524")
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://root:{encoded_password}@localhost:3306/student_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
