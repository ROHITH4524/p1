import random
import bcrypt
import mysql.connector
from datetime import datetime

# DB Configuration
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Rohith@4524",
    "database": "student_db"
}

# Data Lists
FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
SCHOOL_NAMES = ["Silver Oak Academy", "North Star International", "Beacon Hill School", "Evergreen Prep", "Royal Heritage High"]
SUBJECTS = ["Mathematics", "Science", "English"]

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    print("Cleaning up existing data...")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    tables = ["marks", "students", "teachers", "subjects", "users", "schools"]
    for table in tables:
        cursor.execute(f"TRUNCATE TABLE {table};")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()

    print("Seeding Super Admin...")
    super_admin_hash = hash_password("superadmin")
    cursor.execute("INSERT INTO users (name, email, password_hash, role, school_id) VALUES (%s, %s, %s, %s, %s)",
                   ("Platform Admin", "admin@platform.com", super_admin_hash, 'super_admin', None))
    conn.commit()

    for school_idx, school_name in enumerate(SCHOOL_NAMES, 1):
        print(f"Seeding {school_name}...")
        
        # 1. Create School
        cursor.execute("INSERT INTO schools (name, address, email, phone) VALUES (%s, %s, %s, %s)",
                       (school_name, f"{100 + school_idx} Education Blvd", f"contact@{school_name.lower().replace(' ', '')}.com", f"555-010{school_idx}"))
        school_id = cursor.lastrowid

        # 2. Create School Admin
        school_admin_email = f"school{school_idx}@admin.com"
        school_admin_hash = hash_password("schooladmin")
        cursor.execute("INSERT INTO users (name, email, password_hash, role, school_id) VALUES (%s, %s, %s, %s, %s)",
                       (f"{school_name} Admin", school_admin_email, school_admin_hash, 'school_admin', school_id))
        
        # 3. Create Subjects
        subject_ids = []
        for sub_name in SUBJECTS:
            cursor.execute("INSERT INTO subjects (name, school_id) VALUES (%s, %s)", (sub_name, school_id))
            subject_ids.append(cursor.lastrowid)

        # 4. Create 10 Teachers
        teacher_ids = []
        teacher_hash = hash_password("teacher123")
        for t_idx in range(1, 11):
            t_name = f"Teacher {t_idx} - {school_name}"
            t_email = f"teacher{school_idx}_{t_idx}@school.com"
            cursor.execute("INSERT INTO users (name, email, password_hash, role, school_id) VALUES (%s, %s, %s, %s, %s)",
                           (t_name, t_email, teacher_hash, 'teacher', school_id))
            user_id = cursor.lastrowid
            
            cursor.execute("INSERT INTO teachers (user_id, school_id, subject_specialization) VALUES (%s, %s, %s)",
                           (user_id, school_id, random.choice(SUBJECTS)))
            teacher_ids.append(cursor.lastrowid)

        # 5. Create 100 Students
        for s_idx in range(1, 101):
            s_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)} {s_idx}"
            s_email = f"stu_{school_idx}_{s_idx}@school.edu"
            # Default password is their name
            s_hash = hash_password(s_name)
            
            cursor.execute("INSERT INTO users (name, email, password_hash, role, school_id) VALUES (%s, %s, %s, %s, %s)",
                           (s_name, s_email, s_hash, 'student', school_id))
            user_id = cursor.lastrowid
            
            # Assign to a random teacher in this school
            teacher_id = random.choice(teacher_ids)
            
            cursor.execute("INSERT INTO students (user_id, teacher_id, school_id, name, age, gender, class) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (user_id, teacher_id, school_id, s_name, random.randint(14, 18), random.choice(['Male', 'Female', 'Other']), "10th Grade"))
            student_id = cursor.lastrowid

            # 6. Create Marks for 3 Subjects
            for subj_id in subject_ids:
                # Random realistic marks
                mid = random.uniform(15, 50)
                final = random.uniform(20, 50)
                assign = random.uniform(5, 50) # Total 150
                
                total = mid + final + assign
                if total >= 135: grade = 'A+'
                elif total >= 120: grade = 'A'
                elif total >= 105: grade = 'B'
                elif total >= 90: grade = 'C'
                elif total >= 75: grade = 'D'
                else: grade = 'F'

                cursor.execute("INSERT INTO marks (student_id, subject_id, school_id, mid_term, final_term, assignment, grade) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                               (student_id, subj_id, school_id, round(mid, 2), round(final, 2), round(assign, 2), grade))

        conn.commit()
    
    cursor.close()
    conn.close()
    print("Seeding complete! 5 Schools, 50 Teachers, 500 Students + Marks created.")

if __name__ == "__main__":
    seed_data()
