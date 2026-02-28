"""Direct API test for marks submission - captures full error detail"""
import requests
import json

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", 
                        data={"username": email, "password": password},
                        headers={"Content-Type": "application/x-www-form-urlencoded"})
    if res.status_code != 200:
        # Try JSON login
        res = requests.post(f"{BASE_URL}/api/auth/login", 
                           json={"email": email, "password": password})
    print(f"Login status: {res.status_code}")
    try:
        return res.json().get("access_token")
    except:
        print(f"Login response: {res.text[:200]}")
        return None

def test_marks():
    token = get_token("teacher1_1@school.com", "teacher123")
    if not token:
        print("❌ Failed to get token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get students
    stu = requests.get(f"{BASE_URL}/api/teacher/my-students", headers=headers)
    students = stu.json()
    print(f"Students count: {len(students)}")
    if not students:
        print("No students found")
        return
    student_id = students[0]['id']
    
    # Get subjects
    sub = requests.get(f"{BASE_URL}/api/teacher/subjects", headers=headers)
    subjects = sub.json()
    print(f"Subjects: {subjects}")
    if not subjects:
        print("No subjects found")
        return
    subject_id = subjects[0]['id']
    
    # Submit marks
    payload = {
        "marks": [
            {
                "student_id": student_id,
                "subject_id": subject_id,
                "mid_term": 40.0,
                "final_term": 45.0,
                "assignment": 20.0
            }
        ]
    }
    print(f"\nSubmitting payload: {json.dumps(payload, indent=2)}")
    res = requests.post(f"{BASE_URL}/api/teacher/add-marks", json=payload, headers=headers)
    print(f"Status: {res.status_code}")
    try:
        print(f"Response: {json.dumps(res.json(), indent=2)}")
    except:
        print(f"Raw response: {res.text}")

if __name__ == "__main__":
    test_marks()
