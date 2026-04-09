import pytest
import os
import sys
from fastapi.testclient import TestClient

# Add the backend directory to path so we can import from 'main'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app
from database import DB_NAME

@pytest.fixture(scope="session")
def client():
    """Test client fixture"""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def test_db():
    return DB_NAME

@pytest.fixture(scope="session")
def auth_client(client):
    """
    Returns a client with an Authorization header for a newly created test user.
    """
    import random
    import string
    
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    email = f"test_fixture_{rand}@example.com"
    password = "TestPassword123"
    
    # 1. Register
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Fixture User",
        "role": "user"
    }
    reg_response = client.post("/auth/register", json=reg_data)
    
    if reg_response.status_code != 200:
        # DB might be down, skip dependent tests
        pytest.skip(f"Could not register test fixture user: {reg_response.text}")
        
    # 2. Login
    login_response = client.post("/auth/login", data={
        "username": email,
        "password": password
    })
    
    if login_response.status_code != 200:
        pytest.skip(f"Could not login test fixture user: {login_response.text}")
        
        
    token_data = login_response.json()
    token = token_data["access_token"]
    
    # Set the token in headers
    client.headers.update({"Authorization": f"Bearer {token}"})
    
    return client

@pytest.fixture(scope="session")
def admin_client(client):
    """
    Returns a client with an Authorization header for a newly created admin user.
    """
    import random
    import string
    
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    email = f"admin_fixture_{rand}@example.com"
    password = "AdminPassword123"
    
    # 1. Register as admin (if the system allows it via register endpoint)
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Admin Fixture",
        "role": "admin",
        "secret_key": "admin@123"
    }
    reg_response = client.post("/auth/register", json=reg_data)
    
    if reg_response.status_code != 200:
        pytest.skip(f"Could not register admin fixture user: {reg_response.text}")
        
    # 2. Login
    login_response = client.post("/auth/login", data={
        "username": email,
        "password": password
    })
    
    if login_response.status_code != 200:
        pytest.skip(f"Could not login admin fixture user: {login_response.text}")
        
    token_data = login_response.json()
    token = token_data["access_token"]
    
    # Create a NEW client instance to avoid header pollution if used in parallel
    from fastapi.testclient import TestClient
    from main import app
    new_client = TestClient(app)
    new_client.headers.update({"Authorization": f"Bearer {token}"})
    
    return new_client
