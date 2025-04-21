from flask import Blueprint, request, jsonify, session, current_app
import functools

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # TODO: Implement user registration with database
    # For now, return a mock response
    return jsonify({
        "id": 1,
        "username": data['username'],
        "email": data['email'],
        "message": "User registered successfully"
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    """Log in a user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # TODO: Implement user authentication with database
    # For now, return a mock response with a token
    return jsonify({
        "id": 1,
        "username": "user1",
        "email": data['email'],
        "token": "mock_token_12345",
        "message": "Login successful"
    })

@bp.route('/logout', methods=['POST'])
def logout():
    """Log out a user"""
    # Clear the session
    session.clear()
    return jsonify({"message": "Logout successful"})

@bp.route('/user', methods=['GET'])
def get_current_user():
    """Get the current authenticated user"""
    # TODO: Implement proper authentication
    # For now, return a mock user
    return jsonify({
        "id": 1,
        "username": "user1",
        "email": "user1@example.com"
    })

# Authentication decorator
def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        # Check if user is logged in
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authentication required"}), 401
        
        # TODO: Implement proper token validation
        # For now, just check if the header exists
        
        return view(**kwargs)
    return wrapped_view
