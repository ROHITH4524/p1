import mysql.connector
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "Rohith@4524",
    "database": "student_db"
}

def verify_all_logins():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("\n--- CREDENTIAL INTEGRITY REPORT ---\n")
        query = "SELECT email, password_hash, role, is_active FROM users WHERE role != 'student'"
        cursor.execute(query)
        users = cursor.fetchall()
        
        for u in users:
            is_valid_hash = u['password_hash'].startswith('$2y$') or u['password_hash'].startswith('$2b$')
            status = "✅ BCRYPT" if is_valid_hash else "❌ PLAIN/INVALID"
            
            passwords_to_test = ["admin", "superadmin", "schooladmin", "teacher123"]
            found_pass = "Unknown"
            for p in passwords_to_test:
                try:
                    if pwd_context.verify(p, u['password_hash']):
                        found_pass = p
                        break
                except:
                    continue
            
            print(f"Role: {u['role']:15} | Email: {u['email']:25} | Hash: {status} | Pass: {found_pass}")

        print("\n-----------------------------------\n")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_all_logins()
