import requests

BASE_URL = "http://localhost:8000/api"

def main():
    # Register applicant
    email = "test_profile_update@test.com"
    resp = requests.post(f"{BASE_URL}/auth/register/", json={
        "email": email,
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "Applicant",
        "role": "APPLICANT"
    })
    
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": email, "password": "testpass123"
    })
    token = resp.json().get("access")
    
    if not token:
        print("Login failed")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # Update profile using JSON
    print("Sending JSON patch request to /recruitment/applicant/profile/...")
    resp = requests.patch(
        f"{BASE_URL}/recruitment/applicant/profile/",
        headers=headers,
        json={"headline": "Updated via JSON"}
    )
    
    if resp.status_code == 200:
        print("✅ SUCCESS: Profile updated via JSON.")
        print(f"Data: {resp.json().get('headline')}")
    else:
        print(f"❌ FAILED: {resp.status_code}")
        print(resp.text)

if __name__ == "__main__":
    main()
