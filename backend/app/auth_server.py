from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import jwt
import datetime
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
import os
import pyotp

# Initialize auth blueprint
auth_bp = Blueprint('auth', __name__)

# Mock database for users (in a real app, this would be a database)
users_db = {}
refresh_tokens = {}

# Secret key for JWT
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key')

# MFA setup
def generate_totp_secret():
    return pyotp.random_base32()

def verify_totp(secret, token):
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

# User registration
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'username', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
    
    email = data['email']
    username = data['username']
    password = data['password']
    
    # Check if user already exists
    for user_id, user in users_db.items():
        if user['email'] == email or user['username'] == username:
            return jsonify({"error": "User with this email or username already exists"}), 400
    
    # Create user
    user_id = str(uuid.uuid4())
    users_db[user_id] = {
        'id': user_id,
        'email': email,
        'username': username,
        'password': generate_password_hash(password),
        'active': True,
        'confirmed_at': None,
        'roles': ['user'],
        'mfa_enabled': False,
        'mfa_method': None,
        'totp_secret': None,
        'created_at': datetime.datetime.utcnow().isoformat(),
        'subscription_tier': 'free',
        'subscription_status': 'active'
    }
    
    return jsonify({
        "id": user_id,
        "email": email,
        "username": username,
        "message": "User registered successfully"
    }), 201

# User login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
    
    email = data['email']
    password = data['password']
    
    # Find user by email
    user = None
    for user_id, user_data in users_db.items():
        if user_data['email'] == email:
            user = user_data
            break
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    if not user['active']:
        return jsonify({"error": "Account is disabled"}), 401
    
    # Check if MFA is required
    if user['mfa_enabled']:
        return jsonify({
            "id": user['id'],
            "mfa_required": True,
            "mfa_method": user['mfa_method']
        }), 200
    
    # Generate tokens
    access_token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)
    
    # Store refresh token
    refresh_tokens[user['id']] = refresh_token
    
    return jsonify({
        "id": user['id'],
        "email": user['email'],
        "username": user['username'],
        "access_token": access_token,
        "refresh_token": refresh_token,
        "message": "Login successful"
    }), 200

# MFA verification
@auth_bp.route('/mfa/verify', methods=['POST'])
def verify_mfa():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['user_id', 'code']):
        return jsonify({"error": "Missing required fields"}), 400
    
    user_id = data['user_id']
    code = data['code']
    
    # Find user
    if user_id not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    user = users_db[user_id]
    
    if not user['mfa_enabled']:
        return jsonify({"error": "MFA not enabled for this user"}), 400
    
    # Verify TOTP
    if user['mfa_method'] == 'totp':
        if not verify_totp(user['totp_secret'], code):
            return jsonify({"error": "Invalid MFA code"}), 401
    # Other MFA methods would be handled here
    
    # Generate tokens
    access_token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)
    
    # Store refresh token
    refresh_tokens[user['id']] = refresh_token
    
    return jsonify({
        "id": user['id'],
        "email": user['email'],
        "username": user['username'],
        "access_token": access_token,
        "refresh_token": refresh_token,
        "message": "MFA verification successful"
    }), 200

# Token refresh
@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json()
    
    # Validate required fields
    if 'refresh_token' not in data:
        return jsonify({"error": "Missing refresh token"}), 400
    
    refresh_token = data['refresh_token']
    
    try:
        # Decode token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=['HS256'])
        
        # Check token type
        if payload.get('token_type') != 'refresh':
            return jsonify({"error": "Invalid token type"}), 401
        
        # Get user
        user_id = payload.get('sub')
        if user_id not in users_db:
            return jsonify({"error": "User not found"}), 404
        
        user = users_db[user_id]
        
        # Check if token is valid (matches stored token)
        if refresh_tokens.get(user_id) != refresh_token:
            return jsonify({"error": "Invalid refresh token"}), 401
        
        # Generate new access token
        access_token = generate_access_token(user)
        
        return jsonify({
            "access_token": access_token,
            "message": "Token refreshed successfully"
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401

# Get current user
@auth_bp.route('/user', methods=['GET'])
def get_user():
    # Get token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header is missing or invalid"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # Check token type
        if payload.get('token_type') != 'access':
            return jsonify({"error": "Invalid token type"}), 401
        
        # Get user
        user_id = payload.get('sub')
        if user_id not in users_db:
            return jsonify({"error": "User not found"}), 404
        
        user = users_db[user_id]
        
        return jsonify({
            "id": user['id'],
            "email": user['email'],
            "username": user['username'],
            "roles": user['roles'],
            "mfa_enabled": user['mfa_enabled'],
            "subscription_tier": user['subscription_tier'],
            "subscription_status": user['subscription_status']
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

# MFA setup
@auth_bp.route('/mfa/setup', methods=['POST'])
def setup_mfa():
    # Get token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header is missing or invalid"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # Check token type
        if payload.get('token_type') != 'access':
            return jsonify({"error": "Invalid token type"}), 401
        
        # Get user
        user_id = payload.get('sub')
        if user_id not in users_db:
            return jsonify({"error": "User not found"}), 404
        
        user = users_db[user_id]
        
        data = request.get_json()
        
        # Validate required fields
        if 'method' not in data:
            return jsonify({"error": "Missing MFA method"}), 400
        
        method = data['method']
        
        if method == 'totp':
            # Generate TOTP secret
            totp_secret = generate_totp_secret()
            user['totp_secret'] = totp_secret
            user['mfa_method'] = 'totp'
            user['mfa_enabled'] = True
            
            # Generate provisioning URI for QR code
            totp = pyotp.TOTP(totp_secret)
            provisioning_uri = totp.provisioning_uri(
                name=user['email'],
                issuer_name="DeGeNz Lounge"
            )
            
            return jsonify({
                "provisioning_uri": provisioning_uri,
                "secret": totp_secret
            }), 200
        
        # Other MFA methods would be handled here
        
        return jsonify({"error": "Unsupported MFA method"}), 400
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

# MFA disable
@auth_bp.route('/mfa/disable', methods=['POST'])
def disable_mfa():
    # Get token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header is missing or invalid"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # Check token type
        if payload.get('token_type') != 'access':
            return jsonify({"error": "Invalid token type"}), 401
        
        # Get user
        user_id = payload.get('sub')
        if user_id not in users_db:
            return jsonify({"error": "User not found"}), 404
        
        user = users_db[user_id]
        
        user['mfa_enabled'] = False
        user['mfa_method'] = None
        user['totp_secret'] = None
        
        return jsonify({"message": "MFA disabled successfully"}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

# OAuth routes (mock implementations)
@auth_bp.route('/oauth/google', methods=['GET'])
def google_login():
    # In a real app, this would redirect to Google OAuth
    return jsonify({"message": "This is a mock implementation. In a real app, this would redirect to Google OAuth."}), 200

@auth_bp.route('/oauth/github', methods=['GET'])
def github_login():
    # In a real app, this would redirect to GitHub OAuth
    return jsonify({"message": "This is a mock implementation. In a real app, this would redirect to GitHub OAuth."}), 200

@auth_bp.route('/oauth/discord', methods=['GET'])
def discord_login():
    # In a real app, this would redirect to Discord OAuth
    return jsonify({"message": "This is a mock implementation. In a real app, this would redirect to Discord OAuth."}), 200

@auth_bp.route('/oauth/apple', methods=['GET'])
def apple_login():
    # In a real app, this would redirect to Apple OAuth
    return jsonify({"message": "This is a mock implementation. In a real app, this would redirect to Apple OAuth."}), 200

# Helper functions
def generate_access_token(user):
    """Generate JWT access token"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
        'iat': datetime.datetime.utcnow(),
        'sub': user['id'],
        'email': user['email'],
        'roles': user['roles'],
        'token_type': 'access'
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def generate_refresh_token(user):
    """Generate JWT refresh token"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
        'iat': datetime.datetime.utcnow(),
        'sub': user['id'],
        'token_type': 'refresh'
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# Initialize Flask app with auth blueprint
def create_app():
    app = Flask(__name__)
    CORS(app)
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    @app.route('/')
    def index():
        return jsonify({"message": "DeGeNz Lounge Authentication API"}), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
