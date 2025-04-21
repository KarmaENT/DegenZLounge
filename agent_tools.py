from langchain.tools import BaseTool
from langchain.agents import Tool
import requests
import json
import logging

class WebSearchTool(BaseTool):
    """Tool for performing web searches"""
    
    name = "web_search"
    description = "Useful for searching the web for information. Input should be a search query."
    
    def _run(self, query: str) -> str:
        """Run the web search tool"""
        try:
            # This is a mock implementation
            # In a real implementation, you would use a search API
            return f"Search results for '{query}':\n- Result 1: Information about {query}\n- Result 2: More details about {query}\n- Result 3: Related topics to {query}"
        except Exception as e:
            logging.error(f"Error in web search: {str(e)}")
            return f"Error performing search: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Run the web search tool asynchronously"""
        return self._run(query)


class DocumentRetrievalTool(BaseTool):
    """Tool for retrieving documents from a knowledge base"""
    
    name = "document_retrieval"
    description = "Useful for retrieving documents from the knowledge base. Input should be a query to search for relevant documents."
    
    def _run(self, query: str) -> str:
        """Run the document retrieval tool"""
        try:
            # This is a mock implementation
            # In a real implementation, you would use a vector database
            return f"Documents related to '{query}':\n- Document 1: Information about {query}\n- Document 2: More details about {query}\n- Document 3: Related topics to {query}"
        except Exception as e:
            logging.error(f"Error in document retrieval: {str(e)}")
            return f"Error retrieving documents: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Run the document retrieval tool asynchronously"""
        return self._run(query)


class AgentCommunicationTool(BaseTool):
    """Tool for communicating with other agents"""
    
    name = "agent_communication"
    description = "Useful for asking questions to other agents. Input should be in the format 'agent_name: question'."
    
    def __init__(self, agents=None):
        """Initialize the agent communication tool"""
        super().__init__()
        self.agents = agents or {}
    
    def _run(self, input_str: str) -> str:
        """Run the agent communication tool"""
        try:
            # Parse the input
            parts = input_str.split(':', 1)
            if len(parts) != 2:
                return "Invalid input format. Please use 'agent_name: question'"
            
            agent_name = parts[0].strip()
            question = parts[1].strip()
            
            # Check if the agent exists
            if agent_name not in self.agents:
                return f"Agent '{agent_name}' not found. Available agents: {', '.join(self.agents.keys())}"
            
            # Get the agent's response
            agent = self.agents[agent_name]
            response = agent.run(question)
            
            return f"{agent_name}'s response: {response}"
        except Exception as e:
            logging.error(f"Error in agent communication: {str(e)}")
            return f"Error communicating with agent: {str(e)}"
    
    async def _arun(self, input_str: str) -> str:
        """Run the agent communication tool asynchronously"""
        return self._run(input_str)


class ConflictResolutionTool(BaseTool):
    """Tool for resolving conflicts between agent responses"""
    
    name = "conflict_resolution"
    description = "Useful for resolving conflicts between different agent responses. Input should be in the format 'context|response1|response2'."
    
    def __init__(self, ai_service=None):
        """Initialize the conflict resolution tool"""
        super().__init__()
        self.ai_service = ai_service
    
    def _run(self, input_str: str) -> str:
        """Run the conflict resolution tool"""
        try:
            # Parse the input
            parts = input_str.split('|')
            if len(parts) < 3:
                return "Invalid input format. Please use 'context|response1|response2'"
            
            context = parts[0].strip()
            responses = parts[1:]
            
            # Resolve the conflict
            if self.ai_service:
                resolution = self.ai_service.resolve_conflict(responses, context)
            else:
                resolution = "After analyzing the different perspectives, I've determined that the most accurate response is a combination of the key points from each response."
            
            return f"Conflict resolution: {resolution}"
        except Exception as e:
            logging.error(f"Error in conflict resolution: {str(e)}")
            return f"Error resolving conflict: {str(e)}"
    
    async def _arun(self, input_str: str) -> str:
        """Run the conflict resolution tool asynchronously"""
        return self._run(input_str)


def create_agent_tools(ai_service=None, agents=None):
    """Create a set of tools for agents to use"""
    
    # Create the tools
    web_search_tool = WebSearchTool()
    document_retrieval_tool = DocumentRetrievalTool()
    agent_communication_tool = AgentCommunicationTool(agents)
    conflict_resolution_tool = ConflictResolutionTool(ai_service)
    
    # Convert to LangChain Tool format
    tools = [
        Tool(
            name="web_search",
            func=web_search_tool._run,
            description=web_search_tool.description
        ),
        Tool(
            name="document_retrieval",
            func=document_retrieval_tool._run,
            description=document_retrieval_tool.description
        ),
        Tool(
            name="agent_communication",
            func=agent_communication_tool._run,
            description=agent_communication_tool.description
        ),
        Tool(
            name="conflict_resolution",
            func=conflict_resolution_tool._run,
            description=conflict_resolution_tool.description
        )
    ]
    
    return tools
