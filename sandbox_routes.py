from flask import request, jsonify
from app.models.database import db_session
from app.models.sandbox import Sandbox, AgentSession, Message
from flask_socketio import emit, join_room, leave_room
from app import socketio
from app.services.sandbox_manager import SandboxManager
from sqlalchemy.exc import SQLAlchemyError
import logging
import datetime

# Initialize sandbox manager
sandbox_manager = SandboxManager()

def register_sandbox_routes(bp):
    @bp.route('/sessions', methods=['GET'])
    def get_sessions():
        """Get all sandbox sessions for the current user"""
        try:
            # TODO: Implement user authentication and filtering
            sessions = Sandbox.query.all()
            return jsonify([session.to_dict() for session in sessions])
        except SQLAlchemyError as e:
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to retrieve sessions"}), 500
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/sessions', methods=['POST'])
    def create_session():
        """Create a new sandbox session"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if 'name' not in data:
                return jsonify({"error": "Missing required field: name"}), 400
            
            # Create new session
            session = Sandbox(
                name=data['name'],
                description=data.get('description', ''),
                mode=data.get('mode', 'collaborative')
            )
            
            db_session.add(session)
            db_session.commit()
            
            return jsonify(session.to_dict()), 201
        except SQLAlchemyError as e:
            db_session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to create session"}), 500
        except Exception as e:
            db_session.rollback()
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/sessions/<int:id>', methods=['GET'])
    def get_session(id):
        """Get a specific sandbox session by ID"""
        try:
            session = Sandbox.query.get(id)
            if session is None:
                return jsonify({"error": "Session not found"}), 404
            
            # Get agents in this session
            agent_sessions = AgentSession.query.filter_by(sandbox_id=id).all()
            agents = [agent_session.agent.to_dict() for agent_session in agent_sessions if agent_session.agent]
            
            # Get messages in this session
            messages = Message.query.filter_by(sandbox_id=id).order_by(Message.created_at).all()
            
            result = session.to_dict()
            result['agents'] = agents
            result['messages'] = [message.to_dict() for message in messages]
            
            return jsonify(result)
        except SQLAlchemyError as e:
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to retrieve session"}), 500
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/sessions/<int:id>/agents', methods=['POST'])
    def add_agent_to_session(id):
        """Add an agent to a sandbox session"""
        try:
            data = request.get_json()
            
            if 'agent_id' not in data:
                return jsonify({"error": "Missing required field: agent_id"}), 400
            
            session = Sandbox.query.get(id)
            if session is None:
                return jsonify({"error": "Session not found"}), 404
            
            # Check if agent is already in session
            existing = AgentSession.query.filter_by(
                sandbox_id=id, 
                agent_id=data['agent_id']
            ).first()
            
            if existing:
                return jsonify({"error": "Agent already in session"}), 400
            
            # Add agent to session
            agent_session = AgentSession(
                sandbox_id=id,
                agent_id=data['agent_id'],
                is_manager=data.get('is_manager', False)
            )
            
            db_session.add(agent_session)
            db_session.commit()
            
            # Clear the manager chain cache for this sandbox
            sandbox_manager.clear_cache(sandbox_id=id)
            
            return jsonify(agent_session.to_dict())
        except SQLAlchemyError as e:
            db_session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to add agent to session"}), 500
        except Exception as e:
            db_session.rollback()
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/sessions/<int:id>/agents/<int:agent_id>', methods=['DELETE'])
    def remove_agent_from_session(id, agent_id):
        """Remove an agent from a sandbox session"""
        try:
            session = Sandbox.query.get(id)
            if session is None:
                return jsonify({"error": "Session not found"}), 404
            
            agent_session = AgentSession.query.filter_by(
                sandbox_id=id, 
                agent_id=agent_id
            ).first()
            
            if agent_session is None:
                return jsonify({"error": "Agent not in session"}), 404
            
            db_session.delete(agent_session)
            db_session.commit()
            
            # Clear the manager chain cache for this sandbox
            sandbox_manager.clear_cache(sandbox_id=id)
            
            return jsonify({"message": f"Agent {agent_id} removed from session {id}"})
        except SQLAlchemyError as e:
            db_session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to remove agent from session"}), 500
        except Exception as e:
            db_session.rollback()
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

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
    try:
        session_id = data.get('session_id')
        message_content = data.get('message')
        sender_type = data.get('sender_type', 'user')
        sender_id = data.get('sender_id')
        agent_id = data.get('agent_id')
        
        if not all([session_id, message_content, sender_type]):
            return False
        
        room = f"session_{session_id}"
        
        # Process the message using the sandbox manager
        if sender_type == 'user':
            # Save user message
            user_message = Message(
                sandbox_id=session_id,
                sender_type='user',
                sender_id=sender_id,
                content=message_content,
                created_at=datetime.datetime.utcnow()
            )
            
            db_session.add(user_message)
            db_session.commit()
            
            # Broadcast user message
            emit('message', user_message.to_dict(), room=room)
            
            # Process the message
            if agent_id:
                # Get response from specific agent
                agent_message = sandbox_manager.get_agent_response(session_id, agent_id, message_content)
                if agent_message:
                    emit('message', agent_message.to_dict(), room=room)
            else:
                # Get response from manager agent
                manager_message = sandbox_manager.get_manager_response(session_id, message_content)
                if manager_message:
                    emit('message', manager_message.to_dict(), room=room)
        
        return True
    except SQLAlchemyError as e:
        db_session.rollback()
        logging.error(f"Database error in socket message: {str(e)}")
        return False
    except Exception as e:
        db_session.rollback()
        logging.error(f"Unexpected error in socket message: {str(e)}")
        return False

@socketio.on('resolve_conflict')
def on_resolve_conflict(data):
    """Resolve a conflict between agent responses"""
    try:
        session_id = data.get('session_id')
        context = data.get('context')
        responses = data.get('responses')
        
        if not all([session_id, context, responses]):
            return False
        
        room = f"session_{session_id}"
        
        # Resolve the conflict
        resolution_message = sandbox_manager.resolve_conflict(session_id, context, responses)
        if resolution_message:
            emit('message', resolution_message.to_dict(), room=room)
        
        return True
    except Exception as e:
        logging.error(f"Error resolving conflict: {str(e)}")
        return False
