import pytest
from app import create_app, socketio
from app.models.database import db_session, init_db
from flask_socketio import SocketIOTestClient
import json

@pytest.fixture
def app():
    """Create a test app."""
    # Configure app for testing
    app = create_app({
        'TESTING': True,
        'DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test_key'
    })
    
    # Create database tables
    with app.app_context():
        init_db()
    
    yield app
    
    # Clean up
    db_session.remove()

@pytest.fixture
def socket_client(app):
    """Create a test socket client."""
    return SocketIOTestClient(app, socketio)

@pytest.fixture
def http_client(app):
    """Create a test HTTP client."""
    return app.test_client()

@pytest.fixture
def auth_token(http_client):
    """Get an authentication token for testing."""
    # Register a user
    http_client.post('/api/auth/register', 
        json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    
    # Login to get token
    response = http_client.post('/api/auth/login', 
        json={
            'email': 'test@example.com',
            'password': 'password123'
        }
    )
    data = json.loads(response.data)
    return data['token']

@pytest.fixture
def sandbox_id(http_client, auth_token):
    """Create a test sandbox and return its ID."""
    response = http_client.post('/api/sandbox/sessions', 
        json={
            'name': 'Test Session',
            'description': 'A test sandbox session',
            'mode': 'collaborative'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    data = json.loads(response.data)
    return data['id']

def test_socket_connection(socket_client):
    """Test WebSocket connection."""
    connected = socket_client.is_connected()
    assert connected

def test_join_room(socket_client, sandbox_id):
    """Test joining a sandbox session room."""
    response = socket_client.emit('join', {'session_id': sandbox_id}, callback=True)
    assert response is True
    
    # Check for status message
    received = socket_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'status'
    assert 'msg' in received[0]['args'][0]
    assert f"User has joined session {sandbox_id}" in received[0]['args'][0]['msg']

def test_leave_room(socket_client, sandbox_id):
    """Test leaving a sandbox session room."""
    # First join the room
    socket_client.emit('join', {'session_id': sandbox_id})
    socket_client.get_received()  # Clear received messages
    
    # Then leave the room
    response = socket_client.emit('leave', {'session_id': sandbox_id}, callback=True)
    assert response is True
    
    # Check for status message
    received = socket_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'status'
    assert 'msg' in received[0]['args'][0]
    assert f"User has left session {sandbox_id}" in received[0]['args'][0]['msg']

def test_send_message(socket_client, sandbox_id):
    """Test sending a message in a sandbox session."""
    # First join the room
    socket_client.emit('join', {'session_id': sandbox_id})
    socket_client.get_received()  # Clear received messages
    
    # Then send a message
    message_data = {
        'session_id': sandbox_id,
        'message': 'Test message',
        'sender_type': 'user',
        'sender_id': 1
    }
    response = socket_client.emit('message', message_data, callback=True)
    assert response is True
    
    # Check for message broadcast
    received = socket_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'message'
    assert received[0]['args'][0]['content'] == 'Test message'
    assert received[0]['args'][0]['sender_type'] == 'user'
    assert received[0]['args'][0]['sender_id'] == 1
    assert received[0]['args'][0]['sandbox_id'] == sandbox_id

def test_resolve_conflict(socket_client, sandbox_id):
    """Test resolving a conflict between agent responses."""
    # First join the room
    socket_client.emit('join', {'session_id': sandbox_id})
    socket_client.get_received()  # Clear received messages
    
    # Then resolve a conflict
    conflict_data = {
        'session_id': sandbox_id,
        'context': 'What is the best approach for this project?',
        'responses': [
            {
                'sender': 'Agent 1',
                'content': 'We should use approach A because it is more efficient.'
            },
            {
                'sender': 'Agent 2',
                'content': 'We should use approach B because it is more reliable.'
            }
        ]
    }
    response = socket_client.emit('resolve_conflict', conflict_data, callback=True)
    assert response is True
    
    # Check for resolution message
    received = socket_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'message'
    assert received[0]['args'][0]['sender_type'] == 'manager'
    assert received[0]['args'][0]['sandbox_id'] == sandbox_id
