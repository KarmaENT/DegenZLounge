import pytest
from app import create_app
from app.models.database import db_session, init_db
import os
import tempfile
import json

@pytest.fixture
def client():
    """Create a test client for the app."""
    # Configure app for testing
    app = create_app({
        'TESTING': True,
        'DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test_key'
    })
    
    # Create database tables
    with app.app_context():
        init_db()
    
    # Use test client
    with app.test_client() as client:
        yield client
    
    # Clean up
    db_session.remove()

def test_register_user(client):
    """Test user registration."""
    response = client.post('/api/auth/register', 
        json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'id' in data
    assert data['username'] == 'testuser'
    assert data['email'] == 'test@example.com'

def test_login_user(client):
    """Test user login."""
    # First register a user
    client.post('/api/auth/register', 
        json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    
    # Then try to login
    response = client.post('/api/auth/login', 
        json={
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data
    assert data['username'] == 'testuser'
    assert data['email'] == 'test@example.com'

def test_invalid_login(client):
    """Test login with invalid credentials."""
    response = client.post('/api/auth/login', 
        json={
            'email': 'wrong@example.com',
            'password': 'wrongpassword'
        }
    )
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_protected_route(client):
    """Test accessing a protected route."""
    # First register and login to get a token
    client.post('/api/auth/register', 
        json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    
    login_response = client.post('/api/auth/login', 
        json={
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    token = json.loads(login_response.data)['token']
    
    # Try to access a protected route without token
    response = client.get('/api/auth/user')
    assert response.status_code == 401
    
    # Try to access with token
    response = client.get('/api/auth/user', 
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['username'] == 'testuser'
    assert data['email'] == 'test@example.com'
