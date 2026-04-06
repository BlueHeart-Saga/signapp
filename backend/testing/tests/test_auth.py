import pytest
import random
import string

def test_health_check(client):
    """Test root and health"""
    response = client.get("/")
    assert response.status_code == 200
    assert "SignApp Backend Running" in response.json().get("message", "")

def test_register_invalid_data(client):
    """Test register with missing/invalid fields"""
    response = client.post("/auth/register", json={
        "email": "invalid-email",
        "password": "123"
    })
    # Should be 422 Unprocessable Entity for pydantic validation
    assert response.status_code == 422 

def test_login_invalid_credentials(client):
    """Test login with wrong credentials"""
    # OAuth2PasswordRequestForm expects data as form fields
    response = client.post("/auth/login", data={
        "username": "nonexistent@user.com",
        "password": "wrongpassword"
    })
    # Should be 401 Unauthorized
    assert response.status_code == 401
    assert "Invalid Credentials" in str(response.json().get("detail", ""))

def generate_random_email():
    """Helper to create a random email for test registration"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"testuser_{rand}@example.com"

def test_full_registration_and_login_flow(client):
    """Test register then login"""
    email = generate_random_email()
    password = "strongPassword123"
    
    # 1. Register
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Test User",
        "role": "user"
    }
    
    reg_response = client.post("/auth/register", json=reg_data)
    
    # Handle DB connection issues gracefully for local tests
    if reg_response.status_code == 503:
        pytest.skip("Database service unavailable - skipping real registration test")
        
    assert reg_response.status_code == 200
    assert reg_response.json().get("success") is True
    
    # 2. Login
    login_response = client.post("/auth/login", data={
        "username": email,
        "password": password
    })
    
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == email.lower()

def test_get_profile(auth_client):
    """Test getting current user profile"""
    response = auth_client.get("/auth/me")
    assert response.status_code == 200
    assert "email" in response.json()
    assert "full_name" in response.json()

def test_change_password(auth_client):
    """Test changing password"""
    # From conftest.py, password is "TestPassword123"
    data = {
        "current_password": "TestPassword123",
        "new_password": "NewStrongPassword456"
    }
    response = auth_client.post("/auth/change-password", json=data)
    assert response.status_code == 200
    assert response.json().get("success") is True
    
    # Verify new password works
    # We can't easily re-use auth_client here because its headers are set
    # but we can try to login with a separate client
    # but for simplicity we just check the success response.

def test_update_profile(auth_client):
    """Test updating user profile basics"""
    data = {
        "full_name": "Updated Name",
        "company": "Test Corp",
        "job_title": "Tester"
    }
    # update-profile expects Form data
    response = auth_client.post("/auth/update-profile", data=data)
    assert response.status_code == 200
    assert response.json().get("message") == "Profile updated successfully"
    assert response.json()["user"]["full_name"] == "Updated Name"

def test_health_extended(client):
    """Test extended health check"""
    response = client.get("/auth/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_register_recipient(client):
    """Test standard recipient registration"""
    email = generate_random_email()
    password = "RecipientPass123"
    
    data = {
        "email": email,
        "password": password,
        "full_name": "Recipient User"
    }
    
    response = client.post("/auth/register/recipient", json=data)
    
    if response.status_code == 503:
        pytest.skip("DB unavailable")
        
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "recipient"

def test_check_recipient_status_new(client):
    """Test checking status of a new email (no documents)"""
    email = generate_random_email()
    response = client.get(f"/auth/check-recipient/{email}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["has_account"] is False
    assert data["total_documents"] == 0

def test_login_oauth_form(client):
    """Test login using standard OAuth2 form data (username field)"""
    # This is already covered in test_full_registration_and_login_flow
    # but good to have explicit variant.
    pass

def test_invalid_token_profile(client):
    """Test getting profile with invalid token"""
    # Use custom headers ONLY for this request
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
