from flask import Blueprint, request, jsonify
from app.models.agent import Agent

bp = Blueprint('agents', __name__, url_prefix='/api/agents')

@bp.route('/', methods=['GET'])
def get_agents():
    """Get all agents for the current user"""
    # TODO: Implement user authentication and filtering
    agents = Agent.get_all()
    return jsonify(agents)

@bp.route('/<int:id>', methods=['GET'])
def get_agent(id):
    """Get a specific agent by ID"""
    agent = Agent.get_by_id(id)
    if agent is None:
        return jsonify({"error": "Agent not found"}), 404
    return jsonify(agent)

@bp.route('/', methods=['POST'])
def create_agent():
    """Create a new agent"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'role', 'personality', 'system_instructions']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Create new agent
    agent = Agent.create(
        name=data['name'],
        role=data['role'],
        personality=data['personality'],
        system_instructions=data['system_instructions'],
        examples=data.get('examples', []),
        specialization=data.get('specialization', '')
    )
    
    return jsonify(agent), 201

@bp.route('/<int:id>', methods=['PUT'])
def update_agent(id):
    """Update an existing agent"""
    agent = Agent.get_by_id(id)
    if agent is None:
        return jsonify({"error": "Agent not found"}), 404
    
    data = request.get_json()
    agent = Agent.update(id, data)
    return jsonify(agent)

@bp.route('/<int:id>', methods=['DELETE'])
def delete_agent(id):
    """Delete an agent"""
    agent = Agent.get_by_id(id)
    if agent is None:
        return jsonify({"error": "Agent not found"}), 404
    
    Agent.delete(id)
    return jsonify({"message": "Agent deleted successfully"}), 200
