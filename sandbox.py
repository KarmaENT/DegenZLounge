from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room, leave_room
from app.models.sandbox import Sandbox
from app import socketio

bp = Blueprint('sandbox', __name__, url_prefix='/api/sandbox')

@bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all sandbox sessions for the current user"""
    # TODO: Implement user authentication and filtering
    sessions = Sandbox.get_all_sessions()
    return jsonify(sessions)

@bp.route('/sessions', methods=['POST'])
def create_session():
    """Create a new sandbox session"""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({"error": "Missing required field: name"}), 400
    
    # Create new session
    session = Sandbox.create_session(
        name=data['name'],
        description=data.get('description', ''),
        mode=data.get('mode', 'collaborative')
    )
    
    return jsonify(session), 201

@bp.route('/sessions/<int:id>', methods=['GET'])
def get_session(id):
    """Get a specific sandbox session by ID"""
    session = Sandbox.get_session_by_id(id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(session)

@bp.route('/sessions/<int:id>/agents', methods=['POST'])
def add_agent_to_session(id):
    """Add an agent to a sandbox session"""
    data = request.get_json()
    
    if 'agent_id' not in data:
        return jsonify({"error": "Missing required field: agent_id"}), 400
    
    session = Sandbox.get_session_by_id(id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404
    
    result = Sandbox.add_agent_to_session(id, data['agent_id'])
    return jsonify(result)

@bp.route('/sessions/<int:id>/agents/<int:agent_id>', methods=['DELETE'])
def remove_agent_from_session(id, agent_id):
    """Remove an agent from a sandbox session"""
    session = Sandbox.get_session_by_id(id)
    if session is None:
        return jsonify({"error": "Session not found"}), 404
    
    result = Sandbox.remove_agent_from_session(id, agent_id)
    return jsonify(result)

# WebSocket events
@socketio.on('join')
def on_join(data):
    """Join a sandbox session room"""
    session_id = data.get('session_id')
    if not session_id:
        return False
    
    room = f"session_{session_id}"
    join_room(room)
    emit('status', {'msg': f"User has joined session {session_id}"}, room=room)
    return True

@socketio.on('leave')
def on_leave(data):
    """Leave a sandbox session room"""
    session_id = data.get('session_id')
    if not session_id:
        return False
    
    room = f"session_{session_id}"
    leave_room(room)
    emit('status', {'msg': f"User has left session {session_id}"}, room=room)
    return True

@socketio.on('message')
def on_message(data):
    """Handle messages in a sandbox session"""
    session_id = data.get('session_id')
    message = data.get('message')
    sender = data.get('sender')
    agent_id = data.get('agent_id')
    
    if not all([session_id, message, sender]):
        return False
    
    room = f"session_{session_id}"
    
    # If message is from user to agent, trigger agent response
    if agent_id:
        # TODO: Process agent response using AI service
        pass
    
    # Broadcast message to all in the session
    emit('message', {
        'session_id': session_id,
        'message': message,
        'sender': sender,
        'agent_id': agent_id,
        'timestamp': Sandbox.get_timestamp()
    }, room=room)
    
    return True
