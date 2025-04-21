from flask import request, jsonify
from app.models.database import db_session
from sqlalchemy.exc import SQLAlchemyError
import logging
import jwt
import os
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# Mock user database for now
# In a real implementation, this would be a User model in the database
USERS = [
    {
        "id": 1,
        "username": "user1",
        "email": "user1@example.com",
        "password": generate_password_hash("password123")
    }
]

def get_user_by_email(email):
    for user in USERS:
        if user["email"] == email:
            return user
    return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401
        
        try:
            secret_key = os.environ.get('SECRET_KEY', 'dev')
            data = jwt.decode(token, secret_key, algorithms=["HS256"])
            current_user = get_user_by_email(data['email'])
            
            if not current_user:
                return jsonify({"error": "Invalid authentication token"}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Authentication token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def register_auth_routes(bp):
    @bp.route('/register', methods=['POST'])
    def register():
        """Register a new user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Check if user already exists
            if get_user_by_email(data['email']):
                return jsonify({"error": "User with this email already exists"}), 400
            
            # Create new user
            new_user = {
                "id": len(USERS) + 1,
                "username": data['username'],
                "email": data['email'],
                "password": generate_password_hash(data['password'])
            }
            
            USERS.append(new_user)
            
            # In a real implementation, we would add to database
            # db_session.add(new_user)
            # db_session.commit()
            
            return jsonify({
                "id": new_user["id"],
                "username": new_user["username"],
                "email": new_user["email"],
                "message": "User registered successfully"
            }), 201
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/login', methods=['POST'])
    def login():
        """Log in a user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['email', 'password']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Find user by email
            user = get_user_by_email(data['email'])
            if not user:
                return jsonify({"error": "Invalid email or password"}), 401
            
            # Check password
            if not check_password_hash(user["password"], data['password']):
                return jsonify({"error": "Invalid email or password"}), 401
            
            # Generate JWT token
            secret_key = os.environ.get('SECRET_KEY', 'dev')
            token = jwt.encode({
                'id': user["id"],
                'email': user["email"],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, secret_key, algorithm="HS256")
            
            return jsonify({
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "token": token,
                "message": "Login successful"
            })
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/logout', methods=['POST'])
    def logout():
        """Log out a user"""
        # In a stateless JWT implementation, the client simply discards the token
        # No server-side action is needed
        return jsonify({"message": "Logout successful"})

    @bp.route('/user', methods=['GET'])
    @token_required
    def get_current_user(current_user):
        """Get the current authenticated user"""
        return jsonify({
            "id": current_user["id"],
            "username": current_user["username"],
            "email": current_user["email"]
        })
