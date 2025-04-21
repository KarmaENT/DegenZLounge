from flask import request, jsonify
from app.models.database import db_session
from app.models.agent import Agent
from sqlalchemy.exc import SQLAlchemyError
import logging

def register_agent_routes(bp):
    @bp.route('/', methods=['GET'])
    def get_agents():
        """Get all agents for the current user"""
        try:
            # TODO: Implement user authentication and filtering
            agents = Agent.query.all()
            return jsonify([agent.to_dict() for agent in agents])
        except SQLAlchemyError as e:
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to retrieve agents"}), 500
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/<int:id>', methods=['GET'])
    def get_agent(id):
        """Get a specific agent by ID"""
        try:
            agent = Agent.query.get(id)
            if agent is None:
                return jsonify({"error": "Agent not found"}), 404
            return jsonify(agent.to_dict())
        except SQLAlchemyError as e:
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to retrieve agent"}), 500
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/', methods=['POST'])
    def create_agent():
        """Create a new agent"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'role', 'personality', 'system_instructions']
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Create new agent
            agent = Agent(
                name=data['name'],
                role=data['role'],
                personality=data['personality'],
                system_instructions=data['system_instructions'],
                examples=data.get('examples', []),
                specialization=data.get('specialization', '')
            )
            
            db_session.add(agent)
            db_session.commit()
            
            return jsonify(agent.to_dict()), 201
        except SQLAlchemyError as e:
            db_session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to create agent"}), 500
        except Exception as e:
            db_session.rollback()
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/<int:id>', methods=['PUT'])
    def update_agent(id):
        """Update an existing agent"""
        try:
            agent = Agent.query.get(id)
            if agent is None:
                return jsonify({"error": "Agent not found"}), 404
            
            data = request.get_json()
            
            # Update agent fields
            if 'name' in data:
                agent.name = data['name']
            if 'role' in data:
                agent.role = data['role']
            if 'personality' in data:
                agent.personality = data['personality']
            if 'specialization' in data:
                agent.specialization = data['specialization']
            if 'system_instructions' in data:
                agent.system_instructions = data['system_instructions']
            if 'examples' in data:
                agent.examples = data['examples']
            
            db_session.commit()
            
            return jsonify(agent.to_dict())
        except SQLAlchemyError as e:
            db_session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to update agent"}), 500
        except Exception as e:
            db_session.rollback()
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500

    @bp.route('/<int:id>', methods=['DELETE'])
    def delete_agent(id):
        """Delete an agent"""
        try:
            agent = Agent.query.get(id)
            if agent is None:
                return jsonify({"error": "Agent not found"}), 404
            
            db_session.delete(agent)
            db_session.commit()
            
            return jsonify({"message": "Agent deleted successfully"}), 200
        except SQLAlchemyError as e:
            db_session.rollback()
            logging.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to delete agent"}), 500
        except Exception as e:
            db_session.rollback()
            logging.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred"}), 500
