import pytest
from app import create_app
from app.models.database import db_session, init_db
from app.models.agent import Agent
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

@pytest.fixture
def auth_token(client):
    """Get an authentication token for testing."""
    # Register a user
    client.post('/api/auth/register', 
        json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    
    # Login to get token
    response = client.post('/api/auth/login', 
        json={
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    data = json.loads(response.data)
    return data['token']

def test_create_agent(client, auth_token):
    """Test agent creation."""
    response = client.post('/api/agents/', 
        json={
            'name': 'Test Agent',
            'role': 'Testing',
            'personality': 'Analytical',
            'specialization': 'Unit Testing',
            'system_instructions': 'You are a test agent designed to verify functionality.'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Agent'
    assert data['role'] == 'Testing'
    assert data['personality'] == 'Analytical'
    assert data['specialization'] == 'Unit Testing'
    assert 'id' in data

def test_get_agents(client, auth_token):
    """Test retrieving all agents."""
    # First create an agent
    client.post('/api/agents/', 
        json={
            'name': 'Test Agent',
            'role': 'Testing',
            'personality': 'Analytical',
            'specialization': 'Unit Testing',
            'system_instructions': 'You are a test agent designed to verify functionality.'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    # Then retrieve all agents
    response = client.get('/api/agents/',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]['name'] == 'Test Agent'

def test_get_agent_by_id(client, auth_token):
    """Test retrieving a specific agent by ID."""
    # First create an agent
    create_response = client.post('/api/agents/', 
        json={
            'name': 'Test Agent',
            'role': 'Testing',
            'personality': 'Analytical',
            'specialization': 'Unit Testing',
            'system_instructions': 'You are a test agent designed to verify functionality.'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    agent_id = json.loads(create_response.data)['id']
    
    # Then retrieve the agent by ID
    response = client.get(f'/api/agents/{agent_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == agent_id
    assert data['name'] == 'Test Agent'

def test_update_agent(client, auth_token):
    """Test updating an agent."""
    # First create an agent
    create_response = client.post('/api/agents/', 
        json={
            'name': 'Test Agent',
            'role': 'Testing',
            'personality': 'Analytical',
            'specialization': 'Unit Testing',
            'system_instructions': 'You are a test agent designed to verify functionality.'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    agent_id = json.loads(create_response.data)['id']
    
    # Then update the agent
    response = client.put(f'/api/agents/{agent_id}',
        json={
            'name': 'Updated Agent',
            'role': 'Testing',
            'personality': 'Creative',
            'specialization': 'Integration Testing',
            'system_instructions': 'You are an updated test agent.'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == agent_id
    assert data['name'] == 'Updated Agent'
    assert data['personality'] == 'Creative'
    assert data['specialization'] == 'Integration Testing'

def test_delete_agent(client, auth_token):
    """Test deleting an agent."""
    # First create an agent
    create_response = client.post('/api/agents/', 
        json={
            'name': 'Test Agent',
            'role': 'Testing',
            'personality': 'Analytical',
            'specialization': 'Unit Testing',
            'system_instructions': 'You are a test agent designed to verify functionality.'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    agent_id = json.loads(create_response.data)['id']
    
    # Then delete the agent
    response = client.delete(f'/api/agents/{agent_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    
    # Verify the agent is deleted
    get_response = client.get(f'/api/agents/{agent_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert get_response.status_code == 404
