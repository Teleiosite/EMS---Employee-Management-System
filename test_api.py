"""
API Test Script for EMS Applicant Dashboard
Tests all endpoints to verify what's working
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

# Test results
results = []

def log(category, test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    results.append({
        "category": category,
        "test": test_name,
        "status": "PASS" if success else "FAIL",
        "details": details
    })
    print(f"{status} [{category}] {test_name}")
    if details:
        print(f"    {details}")

def test_public_jobs():
    """Test public job listings endpoint"""
    try:
        resp = requests.get(f"{BASE_URL}/recruitment/public/jobs/", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            log("Public API", "Get public jobs", True, f"Jobs count: {len(data.get('results', data))}")
        else:
            log("Public API", "Get public jobs", False, f"Status: {resp.status_code} - {resp.text[:200]}")
    except Exception as e:
        log("Public API", "Get public jobs", False, str(e))

def test_login(email, password, role_name):
    """Test login and return token"""
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login/",
            json={"email": email, "password": password},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access")
            user_data = data.get("user", {})
            log("Auth", f"Login as {role_name}", True, f"Role: {user_data.get('role')}")
            return token
        else:
            log("Auth", f"Login as {role_name}", False, f"Status: {resp.status_code} - {resp.text[:200]}")
            return None
    except Exception as e:
        log("Auth", f"Login as {role_name}", False, str(e))
        return None

def test_protected_endpoint(token, endpoint, method="GET", data=None, test_name="Protected endpoint"):
    """Test a protected endpoint with token"""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        if method == "GET":
            resp = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
        elif method == "POST":
            resp = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=10)
        else:
            resp = requests.request(method, f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=10)
        
        if resp.status_code in [200, 201]:
            log("Protected", test_name, True, f"Status: {resp.status_code}")
            return resp.json()
        elif resp.status_code == 401:
            log("Protected", test_name, False, "Unauthorized - token may be invalid")
        elif resp.status_code == 403:
            log("Protected", test_name, False, "Forbidden - insufficient permissions")
        else:
            log("Protected", test_name, False, f"Status: {resp.status_code} - {resp.text[:300]}")
        return None
    except Exception as e:
        log("Protected", test_name, False, str(e))
        return None

def test_register_applicant():
    """Test applicant registration"""
    test_email = f"test_applicant_{datetime.now().strftime('%H%M%S')}@test.com"
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/register/",
            json={
                "email": test_email,
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "Applicant",
                "role": "APPLICANT"
            },
            timeout=10
        )
        if resp.status_code == 201:
            log("Auth", "Register new applicant", True, f"Email: {test_email}")
            return test_email
        else:
            log("Auth", "Register new applicant", False, f"Status: {resp.status_code} - {resp.text[:200]}")
            return None
    except Exception as e:
        log("Auth", "Register new applicant", False, str(e))
        return None

print("=" * 60)
print("EMS API TESTING")
print("=" * 60)
print(f"Testing at: {datetime.now()}")
print(f"Base URL: {BASE_URL}")
print()

# 1. Test public endpoints
print("\n--- PUBLIC ENDPOINTS ---")
test_public_jobs()

# 2. Test authentication
print("\n--- AUTHENTICATION ---")
admin_token = test_login("admin@company.com", "admin123", "Admin")

# 3. Test admin endpoints
print("\n--- ADMIN ENDPOINTS ---")
if admin_token:
    test_protected_endpoint(admin_token, "/recruitment/jobs/", "GET", None, "Admin: List job postings")
    test_protected_endpoint(admin_token, "/recruitment/candidates/", "GET", None, "Admin: List candidates")
    test_protected_endpoint(admin_token, "/employees/", "GET", None, "Admin: List employees")
    
    # Create a test job posting
    job_data = {
        "title": "Test Software Engineer",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "FULL_TIME",
        "description": "Test job for API testing",
        "responsibilities": ["Coding", "Testing"],
        "required_skills": ["Python", "React"],
        "minimum_experience": 2,
        "education_level": "Bachelor's",
        "status": "OPEN"
    }
    job_result = test_protected_endpoint(admin_token, "/recruitment/jobs/", "POST", job_data, "Admin: Create job posting")
    if job_result:
        print(f"    Created job ID: {job_result.get('id')}")

# 4. Test applicant registration and flow
print("\n--- APPLICANT FLOW ---")
new_email = test_register_applicant()
if new_email:
    applicant_token = test_login(new_email, "testpass123", "New Applicant")
    if applicant_token:
        test_protected_endpoint(applicant_token, "/recruitment/applicant/profile/", "GET", None, "Applicant: Get profile")
        test_protected_endpoint(applicant_token, "/recruitment/applicant/applications/", "GET", None, "Applicant: List my applications")
        
        # Applicant should NOT be able to access admin endpoints
        resp = requests.get(
            f"{BASE_URL}/recruitment/candidates/",
            headers={"Authorization": f"Bearer {applicant_token}"},
            timeout=5
        )
        if resp.status_code == 403:
            log("Security", "Applicant cannot access admin endpoints", True, "Correctly forbidden")
        else:
            log("Security", "Applicant cannot access admin endpoints", False, f"Got status: {resp.status_code}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")
print(f"Total: {len(results)} tests")
print(f"Passed: {passed}")
print(f"Failed: {failed}")

if failed > 0:
    print("\nFailed Tests:")
    for r in results:
        if r["status"] == "FAIL":
            print(f"  - [{r['category']}] {r['test']}: {r['details']}")
