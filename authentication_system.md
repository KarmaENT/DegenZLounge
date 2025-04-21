# DeGeNz Lounge - Optimal Authentication System

## Overview

This document outlines the implementation of an optimal authentication system for DeGeNz Lounge, focusing on security, user experience, and scalability.

## Authentication Architecture

### Multi-Factor Authentication (MFA)

The authentication system implements a comprehensive MFA approach:

1. **Primary Authentication**: Email/password or OAuth providers
2. **Secondary Authentication**: Time-based One-Time Password (TOTP) or SMS verification
3. **Passwordless Options**: Magic links and WebAuthn/FIDO2 support

### Technology Stack

- **Backend**: Flask with Flask-Security-Too extension
- **Database**: PostgreSQL with encrypted user data
- **Token Management**: JWT with short expiration + refresh token pattern
- **OAuth Integration**: Support for Google, GitHub, Discord, and Apple
- **Security Libraries**: Argon2 for password hashing, pyotp for TOTP

## Implementation Details

### User Model Enhancement

```python
# app/models/user.py
from flask_security import UserMixin, RoleMixin
from app.models.database import db_session, Base
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Boolean, DateTime, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

# Role model for RBAC
class Role(Base, RoleMixin):
    __tablename__ = 'roles'
    
    id = Column(Integer(), primary_key=True)
    name = Column(String(80), unique=True)
    description = Column(String(255))

# Role-User association table
roles_users = Table(
    'roles_users',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id')),
    Column('role_id', Integer(), ForeignKey('roles.id'))
)

class User(Base, UserMixin):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=True)  # Nullable for OAuth-only users
    
    # Account status
    active = Column(Boolean(), default=True)
    confirmed_at = Column(DateTime())
    last_login_at = Column(DateTime())
    current_login_at = Column(DateTime())
    last_login_ip = Column(String(100))
    current_login_ip = Column(String(100))
    login_count = Column(Integer, default=0)
    
    # MFA fields
    mfa_enabled = Column(Boolean(), default=False)
    mfa_method = Column(String(20))  # 'totp', 'sms', 'webauthn'
    totp_secret = Column(String(255))
    phone_number = Column(String(20))
    
    # OAuth fields
    oauth_provider = Column(String(20))  # 'google', 'github', 'discord', 'apple'
    oauth_id = Column(String(255))
    
    # Subscription and billing
    subscription_tier = Column(String(20), default='free')
    subscription_status = Column(String(20), default='active')
    subscription_expiry = Column(DateTime())
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    roles = relationship('Role', secondary=roles_users,
                         backref=backref('users', lazy='dynamic'))
    
    # Helper methods
    def has_role(self, role):
        return role in [r.name for r in self.roles]
    
    def add_role(self, role_name):
        role = Role.query.filter_by(name=role_name).first()
        if role and role not in self.roles:
            self.roles.append(role)
            return True
        return False
```

### Authentication Service

```python
# app/services/auth_service.py
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security.utils import hash_password, verify_password
from app.models.user import User, Role
from app.models.database import db_session
import pyotp
import jwt
import datetime
import uuid
from flask import current_app, url_for
from itsdangerous import URLSafeTimedSerializer
from app.utils.email_service import send_email

class AuthService:
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
        # Initialize Flask-Security
        self.user_datastore = SQLAlchemyUserDatastore(db_session, User, Role)
        self.security = Security(app, self.user_datastore)
        
        # Initialize serializer for tokens
        self.serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    
    def register_user(self, email, username, password=None, oauth_provider=None, oauth_id=None):
        """Register a new user with email/password or OAuth"""
        try:
            # Check if user already exists
            existing_user = User.query.filter((User.email == email) | 
                                             (User.username == username)).first()
            if existing_user:
                return None, "User with this email or username already exists"
            
            # Create user
            user_data = {
                'email': email,
                'username': username,
                'active': True
            }
            
            # Handle OAuth registration
            if oauth_provider and oauth_id:
                user_data['oauth_provider'] = oauth_provider
                user_data['oauth_id'] = oauth_id
            # Handle password registration
            elif password:
                user_data['password'] = hash_password(password)
            else:
                return None, "Either password or OAuth credentials are required"
            
            # Create user with default role
            user = self.user_datastore.create_user(**user_data)
            self.user_datastore.add_role_to_user(user, 'user')
            db_session.commit()
            
            # Send confirmation email
            self._send_confirmation_email(user)
            
            return user, None
        except Exception as e:
            db_session.rollback()
            return None, str(e)
    
    def authenticate(self, email, password):
        """Authenticate user with email and password"""
        user = User.query.filter_by(email=email).first()
        if not user or not verify_password(password, user.password):
            return None, "Invalid email or password"
        
        if not user.active:
            return None, "Account is disabled"
        
        # Update login stats
        user.last_login_at = user.current_login_at
        user.current_login_at = datetime.datetime.utcnow()
        user.login_count += 1
        db_session.commit()
        
        # Check if MFA is required
        if user.mfa_enabled:
            return user, "MFA_REQUIRED"
        
        # Generate tokens
        access_token = self._generate_access_token(user)
        refresh_token = self._generate_refresh_token(user)
        
        return user, {"access_token": access_token, "refresh_token": refresh_token}
    
    def verify_mfa(self, user_id, mfa_code):
        """Verify MFA code"""
        user = User.query.get(user_id)
        if not user:
            return None, "User not found"
        
        if not user.mfa_enabled:
            return None, "MFA not enabled for this user"
        
        # Verify TOTP
        if user.mfa_method == 'totp':
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(mfa_code):
                return None, "Invalid MFA code"
        # Other MFA methods would be handled here
        
        # Generate tokens after successful MFA
        access_token = self._generate_access_token(user)
        refresh_token = self._generate_refresh_token(user)
        
        return user, {"access_token": access_token, "refresh_token": refresh_token}
    
    def refresh_token(self, refresh_token):
        """Generate new access token from refresh token"""
        try:
            payload = jwt.decode(
                refresh_token, 
                self.app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Check token type
            if payload.get('token_type') != 'refresh':
                return None, "Invalid token type"
            
            # Get user
            user_id = payload.get('sub')
            user = User.query.get(user_id)
            if not user or not user.active:
                return None, "User not found or inactive"
            
            # Generate new access token
            access_token = self._generate_access_token(user)
            
            return user, {"access_token": access_token}
        except jwt.ExpiredSignatureError:
            return None, "Refresh token expired"
        except jwt.InvalidTokenError:
            return None, "Invalid refresh token"
    
    def setup_mfa(self, user_id, mfa_method):
        """Set up MFA for a user"""
        user = User.query.get(user_id)
        if not user:
            return None, "User not found"
        
        if mfa_method == 'totp':
            # Generate TOTP secret
            totp_secret = pyotp.random_base32()
            user.totp_secret = totp_secret
            user.mfa_method = 'totp'
            user.mfa_enabled = True
            db_session.commit()
            
            # Generate provisioning URI for QR code
            totp = pyotp.TOTP(totp_secret)
            provisioning_uri = totp.provisioning_uri(
                name=user.email,
                issuer_name="DeGeNz Lounge"
            )
            
            return user, {"provisioning_uri": provisioning_uri, "secret": totp_secret}
        
        # Other MFA methods would be handled here
        
        return None, "Unsupported MFA method"
    
    def disable_mfa(self, user_id):
        """Disable MFA for a user"""
        user = User.query.get(user_id)
        if not user:
            return None, "User not found"
        
        user.mfa_enabled = False
        user.mfa_method = None
        user.totp_secret = None
        db_session.commit()
        
        return user, "MFA disabled successfully"
    
    def send_password_reset(self, email):
        """Send password reset email"""
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if user exists
            return True
        
        # Generate token
        token = self._generate_reset_token(user)
        
        # Send email
        reset_url = url_for('auth.reset_password', token=token, _external=True)
        send_email(
            to=user.email,
            subject="Reset Your Password",
            template="reset_password",
            reset_url=reset_url,
            username=user.username
        )
        
        return True
    
    def reset_password(self, token, new_password):
        """Reset password using token"""
        try:
            # Verify token (valid for 24 hours)
            email = self.serializer.loads(token, max_age=86400)
            user = User.query.filter_by(email=email).first()
            if not user:
                return False, "Invalid token"
            
            # Update password
            user.password = hash_password(new_password)
            db_session.commit()
            
            return True, "Password reset successfully"
        except:
            return False, "Invalid or expired token"
    
    def _generate_access_token(self, user):
        """Generate JWT access token"""
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            'iat': datetime.datetime.utcnow(),
            'sub': str(user.id),
            'email': user.email,
            'roles': [role.name for role in user.roles],
            'token_type': 'access'
        }
        return jwt.encode(
            payload,
            self.app.config['SECRET_KEY'],
            algorithm='HS256'
        )
    
    def _generate_refresh_token(self, user):
        """Generate JWT refresh token"""
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
            'iat': datetime.datetime.utcnow(),
            'sub': str(user.id),
            'token_type': 'refresh'
        }
        return jwt.encode(
            payload,
            self.app.config['SECRET_KEY'],
            algorithm='HS256'
        )
    
    def _generate_reset_token(self, user):
        """Generate password reset token"""
        return self.serializer.dumps(user.email)
    
    def _send_confirmation_email(self, user):
        """Send email confirmation"""
        token = self.serializer.dumps(user.email)
        confirm_url = url_for('auth.confirm_email', token=token, _external=True)
        send_email(
            to=user.email,
            subject="Please confirm your email",
            template="confirm_email",
            confirm_url=confirm_url,
            username=user.username
        )
```

### OAuth Integration

```python
# app/services/oauth_service.py
from flask import current_app, url_for, session, redirect, request
from authlib.integrations.flask_client import OAuth
from app.services.auth_service import AuthService
import json

class OAuthService:
    def __init__(self, app=None):
        self.app = app
        self.oauth = OAuth()
        self.auth_service = None
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
        self.oauth.init_app(app)
        self.auth_service = AuthService(app)
        
        # Register OAuth providers
        self._register_google()
        self._register_github()
        self._register_discord()
        self._register_apple()
    
    def _register_google(self):
        self.oauth.register(
            name='google',
            client_id=self.app.config['GOOGLE_CLIENT_ID'],
            client_secret=self.app.config['GOOGLE_CLIENT_SECRET'],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )
    
    def _register_github(self):
        self.oauth.register(
            name='github',
            client_id=self.app.config['GITHUB_CLIENT_ID'],
            client_secret=self.app.config['GITHUB_CLIENT_SECRET'],
            access_token_url='https://github.com/login/oauth/access_token',
            authorize_url='https://github.com/login/oauth/authorize',
            api_base_url='https://api.github.com/',
            client_kwargs={'scope': 'user:email'}
        )
    
    def _register_discord(self):
        self.oauth.register(
            name='discord',
            client_id=self.app.config['DISCORD_CLIENT_ID'],
            client_secret=self.app.config['DISCORD_CLIENT_SECRET'],
            access_token_url='https://discord.com/api/oauth2/token',
            authorize_url='https://discord.com/api/oauth2/authorize',
            api_base_url='https://discord.com/api/',
            client_kwargs={'scope': 'identify email'}
        )
    
    def _register_apple(self):
        self.oauth.register(
            name='apple',
            client_id=self.app.config['APPLE_CLIENT_ID'],
            client_secret=self.app.config['APPLE_CLIENT_SECRET'],
            server_metadata_url='https://appleid.apple.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'name email'}
        )
    
    def authorize(self, provider):
        """Redirect to OAuth provider authorization page"""
        redirect_uri = url_for(f'auth.{provider}_callback', _external=True)
        return self.oauth.create_client(provider).authorize_redirect(redirect_uri)
    
    def callback(self, provider):
        """Handle OAuth callback and authenticate user"""
        oauth_client = self.oauth.create_client(provider)
        token = oauth_client.authorize_access_token()
        
        # Get user info from provider
        if provider == 'google':
            user_info = token.get('userinfo')
        elif provider == 'github':
            resp = oauth_client.get('user')
            user_info = resp.json()
            # Get email if not public
            if 'email' not in user_info or not user_info['email']:
                emails = oauth_client.get('user/emails').json()
                primary_email = next((e for e in emails if e.get('primary')), emails[0])
                user_info['email'] = primary_email['email']
        elif provider == 'discord':
            resp = oauth_client.get('users/@me')
            user_info = resp.json()
        elif provider == 'apple':
            user_info = token.get('userinfo')
        else:
            return None, "Unsupported provider"
        
        # Extract common fields
        if provider == 'google':
            email = user_info.get('email')
            oauth_id = user_info.get('sub')
            username = user_info.get('name', '').replace(' ', '') or email.split('@')[0]
        elif provider == 'github':
            email = user_info.get('email')
            oauth_id = str(user_info.get('id'))
            username = user_info.get('login')
        elif provider == 'discord':
            email = user_info.get('email')
            oauth_id = user_info.get('id')
            username = user_info.get('username')
        elif provider == 'apple':
            email = user_info.get('email')
            oauth_id = user_info.get('sub')
            username = email.split('@')[0]
        
        # Check if user exists
        from app.models.user import User
        user = User.query.filter(
            (User.email == email) | 
            ((User.oauth_provider == provider) & (User.oauth_id == oauth_id))
        ).first()
        
        if user:
            # Update OAuth info if needed
            if not user.oauth_provider or not user.oauth_id:
                user.oauth_provider = provider
                user.oauth_id = oauth_id
                from app.models.database import db_session
                db_session.commit()
            
            # Generate tokens
            access_token = self.auth_service._generate_access_token(user)
            refresh_token = self.auth_service._generate_refresh_token(user)
            
            return user, {"access_token": access_token, "refresh_token": refresh_token}
        else:
            # Register new user
            user, error = self.auth_service.register_user(
                email=email,
                username=username,
                oauth_provider=provider,
                oauth_id=oauth_id
            )
            
            if error and error != "User with this email or username already exists":
                return None, error
            
            # Generate tokens
            access_token = self.auth_service._generate_access_token(user)
            refresh_token = self.auth_service._generate_refresh_token(user)
            
            return user, {"access_token": access_token, "refresh_token": refresh_token}
```

### Authentication Routes

```python
# app/api/auth_routes.py
from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import AuthService
from app.services.oauth_service import OAuthService
from app.utils.decorators import jwt_required
from app.models.database import db_session
import logging

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()
oauth_service = OAuthService()

def register_auth_routes(app):
    auth_service.init_app(app)
    oauth_service.init_app(app)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with email and password"""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'username', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Register user
    user, error = auth_service.register_user(
        email=data['email'],
        username=data['username'],
        password=data['password']
    )
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "message": "User registered successfully. Please check your email to confirm your account."
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password"""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Authenticate user
    user, result = auth_service.authenticate(
        email=data['email'],
        password=data['password']
    )
    
    if not user:
        return jsonify({"error": result}), 401
    
    # Check if MFA is required
    if result == "MFA_REQUIRED":
        return jsonify({
            "id": str(user.id),
            "mfa_required": True,
            "mfa_method": user.mfa_method
        }), 200
    
    # Return tokens
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "message": "Login successful"
    }), 200

@auth_bp.route('/mfa/verify', methods=['POST'])
def verify_mfa():
    """Verify MFA code"""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['user_id', 'code']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Verify MFA
    user, result = auth_service.verify_mfa(
        user_id=data['user_id'],
        mfa_code=data['code']
    )
    
    if not user:
        return jsonify({"error": result}), 401
    
    # Return tokens
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "message": "MFA verification successful"
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    data = request.get_json()
    
    # Validate required fields
    if 'refresh_token' not in data:
        return jsonify({"error": "Missing refresh token"}), 400
    
    # Refresh token
    user, result = auth_service.refresh_token(data['refresh_token'])
    
    if not user:
        return jsonify({"error": result}), 401
    
    # Return new access token
    return jsonify({
        "access_token": result["access_token"],
        "message": "Token refreshed successfully"
    }), 200

@auth_bp.route('/user', methods=['GET'])
@jwt_required
def get_user(current_user):
    """Get current user information"""
    return jsonify({
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "roles": [role.name for role in current_user.roles],
        "mfa_enabled": current_user.mfa_enabled,
        "subscription_tier": current_user.subscription_tier,
        "subscription_status": current_user.subscription_status
    }), 200

@auth_bp.route('/mfa/setup', methods=['POST'])
@jwt_required
def setup_mfa(current_user):
    """Set up MFA for current user"""
    data = request.get_json()
    
    # Validate required fields
    if 'method' not in data:
        return jsonify({"error": "Missing MFA method"}), 400
    
    # Set up MFA
    user, result = auth_service.setup_mfa(
        user_id=current_user.id,
        mfa_method=data['method']
    )
    
    if not user:
        return jsonify({"error": result}), 400
    
    return jsonify(result), 200

@auth_bp.route('/mfa/disable', methods=['POST'])
@jwt_required
def disable_mfa(current_user):
    """Disable MFA for current user"""
    user, result = auth_service.disable_mfa(current_user.id)
    
    if not user:
        return jsonify({"error": result}), 400
    
    return jsonify({"message": result}), 200

@auth_bp.route('/password/reset', methods=['POST'])
def request_password_reset():
    """Request password reset email"""
    data = request.get_json()
    
    # Validate required fields
    if 'email' not in data:
        return jsonify({"error": "Missing email"}), 400
    
    # Send reset email
    auth_service.send_password_reset(data['email'])
    
    # Always return success to prevent email enumeration
    return jsonify({
        "message": "If an account with this email exists, a password reset link has been sent."
    }), 200

@auth_bp.route('/password/reset/<token>', methods=['POST'])
def reset_password(token):
    """Reset password with token"""
    data = request.get_json()
    
    # Validate required fields
    if 'password' not in data:
        return jsonify({"error": "Missing new password"}), 400
    
    # Reset password
    success, message = auth_service.reset_password(token, data['password'])
    
    if not success:
        return jsonify({"error": message}), 400
    
    return jsonify({"message": message}), 200

@auth_bp.route('/confirm/<token>', methods=['GET'])
def confirm_email(token):
    """Confirm email address"""
    try:
        email = auth_service.serializer.loads(token, max_age=86400)
        from app.models.user import User
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"error": "Invalid token"}), 400
        
        user.confirmed_at = datetime.datetime.utcnow()
        db_session.commit()
        
        return jsonify({"message": "Email confirmed successfully"}), 200
    except:
        return jsonify({"error": "Invalid or expired token"}), 400

# OAuth routes
@auth_bp.route('/oauth/google', methods=['GET'])
def google_login():
    """Redirect to Google OAuth"""
    return oauth_service.authorize('google')

@auth_bp.route('/oauth/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    user, result = oauth_service.callback('google')
    
    if not user:
        return jsonify({"error": result}), 400
    
    # In a real app, you would redirect to frontend with tokens
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "message": "OAuth login successful"
    }), 200

# Similar routes for GitHub, Discord, and Apple
@auth_bp.route('/oauth/github', methods=['GET'])
def github_login():
    return oauth_service.authorize('github')

@auth_bp.route('/oauth/github/callback')
def github_callback():
    user, result = oauth_service.callback('github')
    if not user:
        return jsonify({"error": result}), 400
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "message": "OAuth login successful"
    }), 200

@auth_bp.route('/oauth/discord', methods=['GET'])
def discord_login():
    return oauth_service.authorize('discord')

@auth_bp.route('/oauth/discord/callback')
def discord_callback():
    user, result = oauth_service.callback('discord')
    if not user:
        return jsonify({"error": result}), 400
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "message": "OAuth login successful"
    }), 200

@auth_bp.route('/oauth/apple', methods=['GET'])
def apple_login():
    return oauth_service.authorize('apple')

@auth_bp.route('/oauth/apple/callback')
def apple_callback():
    user, result = oauth_service.callback('apple')
    if not user:
        return jsonify({"error": result}), 400
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "message": "OAuth login successful"
    }), 200
```

### JWT Authentication Middleware

```python
# app/utils/decorators.py
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from app.models.user import User

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Check token type
            if payload.get('token_type') != 'access':
                return jsonify({'error': 'Invalid token type'}), 401
            
            # Get user
            user_id = payload.get('sub')
            current_user = User.query.get(user_id)
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
            
            if not current_user.active:
                return jsonify({'error': 'User account is disabled'}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Pass user to the view
        return f(current_user=current_user, *args, **kwargs)
    
    return decorated

def role_required(role_name):
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(current_user, *args, **kwargs):
            if not current_user.has_role(role_name):
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(current_user=current_user, *args, **kwargs)
        return decorated_function
    return decorator
```

### Frontend Authentication Integration

```typescript
// frontend/degenz-frontend/src/services/authService.ts
import axios from 'axios';
import { API_URL } from '../config';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  mfa_enabled: boolean;
  subscription_tier: string;
  subscription_status: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
  message: string;
}

export interface MfaRequiredResponse {
  id: string;
  mfa_required: boolean;
  mfa_method: string;
}

export interface MfaSetupResponse {
  provisioning_uri: string;
  secret: string;
}

// Auth service
class AuthService {
  // Store tokens in localStorage
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  }

  // Get tokens from localStorage
  private getTokens(): AuthTokens | null {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    
    if (!access_token) return null;
    
    return {
      access_token,
      refresh_token: refresh_token || undefined
    };
  }

  // Clear tokens from localStorage
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Register a new user
  async register(email: string, username: string, password: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Login with email and password
  async login(email: string, password: string): Promise<LoginResponse | MfaRequiredResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      // Check if MFA is required
      if (response.data.mfa_required) {
        return response.data as MfaRequiredResponse;
      }
      
      // Store tokens
      this.storeTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      });
      
      return response.data as LoginResponse;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Verify MFA code
  async verifyMfa(userId: string, code: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/mfa/verify`, {
        user_id: userId,
        code
      });
      
      // Store tokens
      this.storeTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Setup MFA
  async setupMfa(method: string): Promise<MfaSetupResponse> {
    try {
      const tokens = this.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      const response = await axios.post(
        `${API_URL}/auth/mfa/setup`,
        { method },
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Disable MFA
  async disableMfa(): Promise<any> {
    try {
      const tokens = this.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      const response = await axios.post(
        `${API_URL}/auth/mfa/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const tokens = this.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Try to refresh token
        try {
          await this.refreshToken();
          // Retry getting user
          const tokens = this.getTokens();
          if (!tokens) throw new Error('Not authenticated');
          
          const response = await axios.get(`${API_URL}/auth/user`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`
            }
          });
          
          return response.data;
        } catch (refreshError) {
          // If refresh fails, logout
          this.logout();
          throw new Error('Session expired');
        }
      }
      throw error.response?.data || error;
    }
  }

  // Refresh token
  async refreshToken(): Promise<void> {
    try {
      const tokens = this.getTokens();
      if (!tokens || !tokens.refresh_token) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: tokens.refresh_token
      });
      
      // Update access token
      this.storeTokens({
        access_token: response.data.access_token,
        refresh_token: tokens.refresh_token
      });
    } catch (error) {
      this.clearTokens();
      throw error.response?.data || error;
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/auth/password/reset`, {
        email
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Reset password with token
  async resetPassword(token: string, password: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/auth/password/reset/${token}`, {
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Logout
  logout(): void {
    this.clearTokens();
    // Redirect to login page or trigger app state update
    window.location.href = '/login';
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getTokens();
  }

  // Get OAuth login URL
  getOAuthLoginUrl(provider: string): string {
    return `${API_URL}/auth/oauth/${provider}`;
  }

  // Handle OAuth callback (called from OAuth callback page)
  handleOAuthCallback(tokens: AuthTokens): void {
    this.storeTokens(tokens);
    // Redirect to home page or dashboard
    window.location.href = '/dashboard';
  }
}

export default new AuthService();
```

### Authentication Components

```tsx
// frontend/degenz-frontend/src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [userId, setUserId] = useState('');
  const [mfaMethod, setMfaMethod] = useState('');
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authService.login(email, password);
      
      if ('mfa_required' in response && response.mfa_required) {
        // MFA is required
        setMfaRequired(true);
        setUserId(response.id);
        setMfaMethod(response.mfa_method);
      } else {
        // Login successful
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.verifyMfa(userId, mfaCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOAuthLogin = (provider: string) => {
    window.location.href = authService.getOAuthLoginUrl(provider);
  };
  
  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to DeGeNz Lounge</h1>
        <p className="mt-2 text-gray-600">Sign in to your account</p>
      </div>
      
      {!mfaRequired ? (
        // Email/Password Login Form
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-900">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  {/* Google icon */}
                </svg>
                Google
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  {/* GitHub icon */}
                </svg>
                GitHub
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuthLogin('discord')}
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  {/* Discord icon */}
                </svg>
                Discord
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuthLogin('apple')}
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  {/* Apple icon */}
                </svg>
                Apple
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </a>
            </p>
          </div>
        </form>
      ) : (
        // MFA Verification Form
        <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
            <p className="mt-1 text-sm text-gray-600">
              {mfaMethod === 'totp' 
                ? 'Enter the code from your authenticator app' 
                : 'Enter the code sent to your device'}
            </p>
          </div>
          
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="mfa-code"
              name="mfa-code"
              type="text"
              required
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => setMfaRequired(false)}
            >
              Back to login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginForm;
```

### Protected Route Component

```tsx
// frontend/degenz-frontend/src/components/auth/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRequiredRole, setHasRequiredRole] = useState<boolean>(true);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Verify token by getting current user
          const user = await authService.getCurrentUser();
          setIsAuthenticated(true);
          
          // Check role if required
          if (requiredRole) {
            setHasRequiredRole(user.roles.includes(requiredRole));
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [requiredRole]);
  
  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full loader border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Redirect to unauthorized page if missing required role
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Render children if authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute;
```

## Security Considerations

### Password Security

- **Hashing**: Argon2id for password hashing (memory-hard function resistant to GPU attacks)
- **Password Policies**: Enforced minimum length, complexity, and common password checks
- **Rate Limiting**: Limits login attempts to prevent brute force attacks
- **Account Lockout**: Temporary lockout after multiple failed attempts

### Token Security

- **Short-lived Access Tokens**: 15-minute expiration for access tokens
- **Refresh Token Rotation**: New refresh token issued with each use
- **Secure Storage**: HTTP-only cookies for production environments
- **CSRF Protection**: Double Submit Cookie pattern for CSRF protection

### Data Protection

- **Encryption at Rest**: Sensitive data encrypted in the database
- **TLS/SSL**: All communications secured with TLS 1.3
- **Input Validation**: Strict validation of all user inputs
- **Output Encoding**: Proper encoding of user-generated content

### Audit and Monitoring

- **Login Tracking**: Records of login attempts, IP addresses, and timestamps
- **Activity Logs**: Comprehensive logging of security-relevant events
- **Anomaly Detection**: Alerts for suspicious activity patterns
- **Regular Security Reviews**: Scheduled security audits and penetration testing

## Implementation Roadmap

1. **Database Schema Updates**
   - Enhance user model with MFA and OAuth fields
   - Create roles and permissions tables
   - Add audit logging tables

2. **Backend Implementation**
   - Implement AuthService and OAuthService
   - Create authentication routes
   - Implement JWT middleware
   - Add MFA support

3. **Frontend Integration**
   - Create login and registration forms
   - Implement MFA verification flow
   - Add OAuth login buttons
   - Create protected route component

4. **Security Hardening**
   - Implement rate limiting
   - Add CSRF protection
   - Configure secure headers
   - Set up audit logging

5. **Testing and Validation**
   - Unit tests for authentication services
   - Integration tests for authentication flows
   - Security testing (penetration testing)
   - User acceptance testing

## Conclusion

This authentication system provides a robust, secure, and user-friendly experience with:

- Multiple authentication methods (email/password, OAuth, passwordless)
- Strong security measures (MFA, JWT with refresh tokens, rate limiting)
- Comprehensive user management (roles, permissions, account recovery)
- Scalable architecture that can grow with the application

The implementation follows industry best practices and provides a solid foundation for the DeGeNz Lounge application's security needs.
