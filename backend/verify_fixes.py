import requests

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    return res.json().get("access_token")

def verify_fixes():
    # 1. Verify Student Dashboard Response
    print("Verifying Student Dashboard Response...")
    student_token = get_token("stu_1_1@school.edu", "James Miller 1")
    headers = {"Authorization": f"Bearer {student_token}"}
    dash_res = requests.get(f"{BASE_URL}/api/student/my-dashboard", headers=headers)
    data = dash_res.json()
    print(f"Dashboard Data: {data}")
    if "average_marks" in data:
        print("✅ average_marks found in dashboard response.")
    else:
        print("❌ average_marks NOT found in dashboard response.")

    # 2. Verify Teacher Marks Submission
    print("\nVerifying Teacher Marks Submission...")
    teacher_token = get_token("teacher1_1@school.com", "teacher123")
    headers = {"Authorization": f"Bearer {teacher_token}"}
    
    # Get a student ID and subject ID
    students_res = requests.get(f"{BASE_URL}/api/teacher/my-students", headers=headers)
    student_id = students_res.json()[0]['id']
    subjects_res = requests.get(f"{BASE_URL}/api/teacher/subjects", headers=headers)
    subject_id = subjects_res.json()[0]['id']
    
    payload = {
        "marks": [
            {
                "student_id": student_id,
                "subject_id": subject_id,
                "mid_term": 45,
                "final_term": 48,
                "assignment": 49
            }
        ]
    }
    marks_res = requests.post(f"{BASE_URL}/api/teacher/add-marks", json=payload, headers=headers)
    try:
        print(f"Marks Submission Status: {marks_res.status_code}")
        print(f"Marks Submission Response: {marks_res.json()}")
    except:
        print(f"Marks Submission Error Content: {marks_res.text}")
        
    if marks_res.status_code == 200:
        print("✅ Bulk marks submission successful.")
    else:
        print(f"❌ Bulk marks submission failed with status {marks_res.status_code}.")

if __name__ == "__main__":
    verify_fixes()
