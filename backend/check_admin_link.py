import pymysql

try:
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='Rohith@4524',
        database='student_db',
        cursorclass=pymysql.cursors.DictCursor
    )
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, name, email, role, school_id FROM users WHERE role='school_admin'")
        print("School Admin Users:", cursor.fetchall())
        cursor.execute("SELECT id, name FROM schools")
        print("\nAvailable Schools:", cursor.fetchall())
    conn.close()
except Exception as e:
    print(f"Error: {e}")
