import pytest
from app import create_app
from app.models.database import db_session, init_db
from app.models.sandbox import Sandbox, AgentSession, Message
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

@pytest.fixture
def agent_id(client, auth_token):
    """Create a test agent and return its ID."""
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
    data = json.loads(response.data)
    return data['id']

def test_create_sandbox(client, auth_token):
    """Test sandbox session creation."""
    response = client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Session'
    assert data['description'] == 'A test sandbox session'
    assert data['mode'] == 'collaborative'
    assert 'id' in data

def test_get_sandboxes(client, auth_token):
    """Test retrieving all sandbox sessions."""
    # First create a sandbox
    client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    # Then retrieve all sandboxes
    response = client.get('/api/sandbox/sessions',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]['name'] == 'Test Session'

def test_get_sandbox_by_id(client, auth_token):
    """Test retrieving a specific sandbox by ID."""
    # First create a sandbox
    create_response = client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    sandbox_id = json.loads(create_response.data)['id']
    
    # Then retrieve the sandbox by ID
    response = client.get(f'/api/sandbox/sessions/{sandbox_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == sandbox_id
    assert data['name'] == 'Test Session'
    assert 'agents' in data
    assert 'messages' in data

def test_add_agent_to_sandbox(client, auth_token, agent_id):
    """Test adding an agent to a sandbox session."""
    # First create a sandbox
    create_response = client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    sandbox_id = json.loads(create_response.data)['id']
    
    # Then add an agent to the sandbox
    response = client.post(f'/api/sandbox/sessions/{sandbox_id}/agents',
        json={
            'agent_id': agent_id,
            'is_manager': False
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['sandbox_id'] == sandbox_id
    assert data['agent_id'] == agent_id
    assert data['is_manager'] is False
    
    # Verify the agent is in the sandbox
    response = client.get(f'/api/sandbox/sessions/{sandbox_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    data = json.loads(response.data)
    assert len(data['agents']) == 1
    assert data['agents'][0]['id'] == agent_id

def test_remove_agent_from_sandbox(client, auth_token, agent_id):
    """Test removing an agent from a sandbox session."""
    # First create a sandbox
    create_response = client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    sandbox_id = json.loads(create_response.data)['id']
    
    # Add an agent to the sandbox
    client.post(f'/api/sandbox/sessions/{sandbox_id}/agents',
        json={
            'agent_id': agent_id,
            'is_manager': False
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    # Then remove the agent from the sandbox
    response = client.delete(f'/api/sandbox/sessions/{sandbox_id}/agents/{agent_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    
    # Verify the agent is removed
    response = client.get(f'/api/sandbox/sessions/{sandbox_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    data = json.loads(response.data)
    assert len(data['agents']) == 0
