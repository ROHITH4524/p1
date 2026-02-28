from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import models for creating tables
from models import user, student, marks, school, teacher, subject

# Import routes
from routes import auth, super_admin, school_admin, teacher, student, marks as marks_route, ml

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Student Performance Analytics Platform")

# Allow CORS for http://localhost:3000
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(super_admin.router, prefix="/api/super-admin", tags=["Super Admin"])
app.include_router(school_admin.router, prefix="/api/school-admin", tags=["School Admin"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])
app.include_router(marks_route.router, prefix="/api/marks", tags=["Marks"])
app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])

@app.get("/")
def root():
    return {"message": "Welcome to the Student Performance Analytics API"}
