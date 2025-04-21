from app.services.ai_service import AIService
from app.services.agent_tools import create_agent_tools
from app.models.database import db_session
from app.models.agent import Agent
from app.models.sandbox import Sandbox, AgentSession, Message
import logging
import datetime

class SandboxManager:
    """Manager for sandbox sessions and agent interactions"""
    
    def __init__(self):
        """Initialize the sandbox manager"""
        self.ai_service = AIService()
        self.agent_chains = {}  # Cache for agent chains
        self.manager_chains = {}  # Cache for manager chains
        self.agent_executors = {}  # Cache for agent executors
    
    def get_agent_chain(self, agent_id):
        """Get or create an agent chain"""
        if agent_id in self.agent_chains:
            return self.agent_chains[agent_id]
        
        try:
            # Get the agent from the database
            agent = Agent.query.get(agent_id)
            if not agent:
                logging.error(f"Agent {agent_id} not found")
                return None
            
            # Create the agent chain
            agent_config = agent.to_dict()
            chain = self.ai_service.create_agent_chain(agent_config)
            
            # Cache the chain
            self.agent_chains[agent_id] = chain
            
            return chain
        except Exception as e:
            logging.error(f"Error getting agent chain: {str(e)}")
            return None
    
    def get_manager_chain(self, sandbox_id, mode="collaborative"):
        """Get or create a manager chain"""
        if sandbox_id in self.manager_chains:
            return self.manager_chains[sandbox_id]
        
        try:
            # Get the sandbox from the database
            sandbox = Sandbox.query.get(sandbox_id)
            if not sandbox:
                logging.error(f"Sandbox {sandbox_id} not found")
                return None
            
            # Get the agents in the sandbox
            agent_sessions = AgentSession.query.filter_by(sandbox_id=sandbox_id).all()
            agents = []
            for agent_session in agent_sessions:
                if agent_session.agent:
                    agents.append(agent_session.agent.to_dict())
            
            # Create the manager chain
            chain = self.ai_service.create_manager_chain(mode=sandbox.mode, agents=agents)
            
            # Cache the chain
            self.manager_chains[sandbox_id] = chain
            
            return chain
        except Exception as e:
            logging.error(f"Error getting manager chain: {str(e)}")
            return None
    
    def get_agent_executor(self, agent_id):
        """Get or create an agent executor with tools"""
        if agent_id in self.agent_executors:
            return self.agent_executors[agent_id]
        
        try:
            # Get the agent from the database
            agent = Agent.query.get(agent_id)
            if not agent:
                logging.error(f"Agent {agent_id} not found")
                return None
            
            # Create agent tools
            tools = create_agent_tools(self.ai_service)
            
            # Create the agent executor
            agent_config = agent.to_dict()
            executor = self.ai_service.create_agent_executor(agent_config, tools)
            
            # Cache the executor
            self.agent_executors[agent_id] = executor
            
            return executor
        except Exception as e:
            logging.error(f"Error getting agent executor: {str(e)}")
            return None
    
    def process_user_message(self, sandbox_id, message_content, user_id=None, target_agent_id=None):
        """Process a user message in a sandbox session"""
        try:
            # Save the user message
            user_message = Message(
                sandbox_id=sandbox_id,
                sender_type='user',
                sender_id=user_id,
                content=message_content,
                created_at=datetime.datetime.utcnow()
            )
            
            db_session.add(user_message)
            db_session.commit()
            
            # If a specific agent is targeted, get a response from that agent
            if target_agent_id:
                return self.get_agent_response(sandbox_id, target_agent_id, message_content)
            
            # Otherwise, get a response from the manager agent
            return self.get_manager_response(sandbox_id, message_content)
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error processing user message: {str(e)}")
            return None
    
    def get_agent_response(self, sandbox_id, agent_id, message_content):
        """Get a response from a specific agent"""
        try:
            # Get the agent chain
            chain = self.get_agent_chain(agent_id)
            if not chain:
                return None
            
            # Generate the response
            response = self.ai_service.generate_response(chain, message_content)
            
            # Save the agent response
            agent_message = Message(
                sandbox_id=sandbox_id,
                sender_type='agent',
                sender_id=agent_id,
                content=response,
                created_at=datetime.datetime.utcnow()
            )
            
            db_session.add(agent_message)
            db_session.commit()
            
            return agent_message
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error getting agent response: {str(e)}")
            return None
    
    def get_manager_response(self, sandbox_id, message_content):
        """Get a response from the manager agent"""
        try:
            # Get the sandbox
            sandbox = Sandbox.query.get(sandbox_id)
            if not sandbox:
                logging.error(f"Sandbox {sandbox_id} not found")
                return None
            
            # Get the manager chain
            chain = self.get_manager_chain(sandbox_id, sandbox.mode)
            if not chain:
                return None
            
            # Generate the response
            response = self.ai_service.generate_response(chain, message_content)
            
            # Save the manager response
            manager_message = Message(
                sandbox_id=sandbox_id,
                sender_type='manager',
                sender_id=0,  # Manager has ID 0
                content=response,
                created_at=datetime.datetime.utcnow()
            )
            
            db_session.add(manager_message)
            db_session.commit()
            
            return manager_message
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error getting manager response: {str(e)}")
            return None
    
    def resolve_conflict(self, sandbox_id, context, responses):
        """Resolve a conflict between agent responses"""
        try:
            # Convert responses to string format
            responses_str = "\n\n".join([f"{resp['sender']}: {resp['content']}" for resp in responses])
            
            # Resolve the conflict
            resolution = self.ai_service.resolve_conflict(responses_str, context)
            
            # Save the resolution as a manager message
            resolution_message = Message(
                sandbox_id=sandbox_id,
                sender_type='manager',
                sender_id=0,  # Manager has ID 0
                content=resolution,
                created_at=datetime.datetime.utcnow()
            )
            
            db_session.add(resolution_message)
            db_session.commit()
            
            return resolution_message
        except Exception as e:
            db_session.rollback()
            logging.error(f"Error resolving conflict: {str(e)}")
            return None
    
    def clear_cache(self, agent_id=None, sandbox_id=None):
        """Clear the cache for a specific agent or sandbox, or all if none specified"""
        if agent_id:
            if agent_id in self.agent_chains:
                del self.agent_chains[agent_id]
            if agent_id in self.agent_executors:
                del self.agent_executors[agent_id]
        elif sandbox_id:
            if sandbox_id in self.manager_chains:
                del self.manager_chains[sandbox_id]
        else:
            self.agent_chains = {}
            self.manager_chains = {}
            self.agent_executors = {}
