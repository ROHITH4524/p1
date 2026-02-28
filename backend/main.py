from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import models for creating tables
from models import user, student, marks

# Import routes
from routes import auth, students, marks as marks_route, ml

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
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(marks_route.router, prefix="/api/marks", tags=["Marks"])
app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])

@app.get("/")
def root():
    return {"message": "Welcome to the Student Performance Analytics API"}
