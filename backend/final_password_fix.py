import mysql.connector
import bcrypt

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "Rohith@4524",
    "database": "student_db"
}

def reset_passwords():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    updates = [
        ("admin@platform.com", "superadmin"),
        ("schooladmin@cityhigh.com", "schooladmin"),
        ("teacher1@cityhigh.com", "teacher123"),
        ("teacher2@cityhigh.com", "teacher123")
    ]
    
    print("Resetting passwords for main accounts...")
    for email, password in updates:
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        query = "UPDATE users SET password_hash = %s, is_active = 1 WHERE email = %s"
        cursor.execute(query, (hashed, email))
        if cursor.rowcount > 0:
            print(f"✅ Reset success: {email} -> {password}")
        else:
            print(f"⚠️ Account not found: {email}")
            
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    reset_passwords()
