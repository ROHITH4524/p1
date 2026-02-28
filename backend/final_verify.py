import requests

BASE_URL = "http://localhost:8000/api"

def test_role(email, password, role_name, dashboard_path):
    print(f"\nTesting {role_name} ({email})...")
    try:
        # 1. Login
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if login_res.status_code != 200:
            print(f"❌ Login failed: {login_res.json()}")
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Fetch Dashboard
        dash_res = requests.get(f"{BASE_URL}{dashboard_path}", headers=headers)
        if dash_res.status_code == 200:
            data = dash_res.json()
            print(f"✅ Dashboard OK. Data preview: {str(data)[:200]}...")
        else:
            print(f"❌ Dashboard failed ({dash_res.status_code}): {dash_res.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Test Super Admin
    test_role("admin@platform.com", "superadmin", "Super Admin", "/super-admin/dashboard")
    
    # Test School Admin (from School 1)
    test_role("school1@admin.com", "schooladmin", "School Admin", "/school-admin/dashboard")
    
    # Test Teacher (from School 1)
    test_role("teacher1_1@school.com", "teacher123", "Teacher", "/teacher/my-report")
    
    # Test Student (from School 1)
    test_role("stu_1_1@school.edu", "James Smith 1", "Student", "/student/my-dashboard")
    
    # Test ML At-Risk
    test_role("teacher1_1@school.com", "teacher123", "ML At-Risk", "/ml/at-risk")
