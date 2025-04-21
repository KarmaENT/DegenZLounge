import pytest
import json
from app import create_app
from app.models.database import db
from app.models.user import User
from app.models.agent import Agent
from app.models.sandbox import Sandbox, Message
import jwt
import datetime
from werkzeug.security import generate_password_hash

@pytest.fixture
def app():
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_SECRET'] = 'test-jwt-secret'
    
    with app.app_context():
        db.create_all()
        
        # Create test user
        test_user = User(
            email='test@example.com',
            username='testuser',
            password=generate_password_hash('password123'),
            active=True,
            roles=['user'],
            mfa_enabled=False,
            subscription_tier='free',
            subscription_status='active'
        )
        db.session.add(test_user)
        
        # Create test agent
        test_agent = Agent(
            name='Test Agent',
            role='Assistant',
            personality='Helpful and friendly',
            specialization='General assistance',
            system_instructions='Be helpful and concise',
            examples='User: Hello\nAssistant: Hi there! How can I help you today?',
            user_id=1
        )
        db.session.add(test_agent)
        
        # Create test sandbox
        test_sandbox = Sandbox(
            name='Test Sandbox',
            description='A test sandbox',
            mode='collaborative',
            user_id=1
        )
        db.session.add(test_sandbox)
        
        db.session.commit()
        
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(app):
    with app.app_context():
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            'iat': datetime.datetime.utcnow(),
            'sub': 1,
            'email': 'test@example.com',
            'roles': ['user'],
            'token_type': 'access'
        }
        return jwt.encode(payload, app.config['JWT_SECRET'], algorithm='HS256')

def test_register(client):
    response = client.post('/api/auth/register', json={
        'email': 'newuser@example.com',
        'username': 'newuser',
        'password': 'password123'
    })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'id' in data
    assert data['email'] == 'newuser@example.com'
    assert data['username'] == 'newuser'

def test_login(client):
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['email'] == 'test@example.com'
    assert data['username'] == 'testuser'

def test_login_invalid_credentials(client):
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrongpassword'
    })
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_get_user(client, auth_token):
    response = client.get('/api/auth/user', headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['email'] == 'test@example.com'
    assert data['username'] == 'testuser'
    assert data['subscription_tier'] == 'free'

def test_get_user_unauthorized(client):
    response = client.get('/api/auth/user')
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_create_agent(client, auth_token):
    response = client.post('/api/agents', json={
        'name': 'New Agent',
        'role': 'Researcher',
        'personality': 'Analytical and thorough',
        'specialization': 'Data analysis',
        'system_instructions': 'Provide detailed analysis',
        'examples': 'User: Analyze this data\nAssistant: Here is my analysis...'
    }, headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'New Agent'
    assert data['role'] == 'Researcher'

def test_get_agents(client, auth_token):
    response = client.get('/api/agents', headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]['name'] == 'Test Agent'

def test_create_sandbox(client, auth_token):
    response = client.post('/api/sandbox', json={
        'name': 'New Sandbox',
        'description': 'A new test sandbox',
        'mode': 'strict',
        'agents': [1]
    }, headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'New Sandbox'
    assert data['mode'] == 'strict'

def test_get_sandboxes(client, auth_token):
    response = client.get('/api/sandbox', headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]['name'] == 'Test Sandbox'

def test_subscription_upgrade(client, auth_token):
    # Mock subscription upgrade endpoint
    response = client.post('/api/subscription/upgrade', json={
        'plan': 'pro',
        'payment_method_id': 'pm_test_123'
    }, headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['subscription_tier'] == 'pro'
    assert data['subscription_status'] == 'active'

def test_token_purchase(client, auth_token):
    # Mock token purchase endpoint
    response = client.post('/api/tokens/purchase', json={
        'amount': 500,
        'payment_method_id': 'pm_test_123'
    }, headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['tokens_added'] == 500
    assert 'new_balance' in data

def test_marketplace_listing(client, auth_token):
    # Mock marketplace listing endpoint
    response = client.get('/api/marketplace', headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) > 0
    assert 'id' in data[0]
    assert 'name' in data[0]
    assert 'price' in data[0]

def test_marketplace_purchase(client, auth_token):
    # Mock marketplace purchase endpoint
    response = client.post('/api/marketplace/purchase', json={
        'item_id': 1,
        'payment_method': 'tokens'
    }, headers={
        'Authorization': f'Bearer {auth_token}'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'item' in data
