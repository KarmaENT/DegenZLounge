from langchain.llms import Gemini
from langchain.chains import LLMChain, ConversationChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.agents import Tool, AgentExecutor, ZeroShotAgent
import os
import logging

class AIService:
    def __init__(self, api_key=None):
        """Initialize the AI service with Gemini Flash 2.0"""
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY')
        try:
            self.llm = Gemini(api_key=self.api_key, model_name="gemini-flash-2.0")
            logging.info("AI Service initialized with Gemini Flash 2.0")
        except Exception as e:
            logging.error(f"Failed to initialize Gemini: {str(e)}")
            # Fallback to a mock implementation for development
            self.llm = None
            logging.warning("Using mock AI implementation")
        
    def create_agent_chain(self, agent_config):
        """Create a LangChain chain for a specific agent"""
        try:
            # Create a prompt template based on agent configuration
            template = f"""
            You are {agent_config['name']}, a {agent_config['role']} with a {agent_config['personality']} personality.
            
            {agent_config['system_instructions']}
            
            Current conversation:
            {{chat_history}}
            
            Human: {{input}}
            {agent_config['name']}:
            """
            
            prompt = PromptTemplate(
                input_variables=["chat_history", "input"],
                template=template
            )
            
            # Create memory for conversation history
            memory = ConversationBufferMemory(memory_key="chat_history")
            
            # Create the chain
            if self.llm:
                chain = LLMChain(
                    llm=self.llm,
                    prompt=prompt,
                    memory=memory,
                    verbose=True
                )
            else:
                # Mock implementation for development
                chain = MockAgentChain(agent_config)
            
            return chain
        except Exception as e:
            logging.error(f"Error creating agent chain: {str(e)}")
            return MockAgentChain(agent_config)
    
    def create_manager_chain(self, mode="collaborative", agents=None):
        """Create a LangChain chain for the manager agent"""
        try:
            # Create a prompt template for the manager agent
            agents_str = ""
            if agents:
                agents_str = "\n".join([f"- {agent['name']}: {agent['role']}" for agent in agents])
            
            template = f"""
            You are the Manager Agent responsible for orchestrating tasks between specialized AI agents.
            Your mode is: {mode}
            
            In collaborative mode, you should facilitate cooperation between agents.
            In strict mode, you should assign specific tasks to each agent based on their specialization.
            
            Available agents:
            {agents_str}
            
            Current conversation:
            {{chat_history}}
            
            Task:
            {{input}}
            
            Manager Agent:
            """
            
            prompt = PromptTemplate(
                input_variables=["chat_history", "input"],
                template=template
            )
            
            # Create memory for conversation history
            memory = ConversationBufferMemory(memory_key="chat_history")
            
            # Create the chain
            if self.llm:
                chain = LLMChain(
                    llm=self.llm,
                    prompt=prompt,
                    memory=memory,
                    verbose=True
                )
            else:
                # Mock implementation for development
                chain = MockManagerChain(mode, agents)
            
            return chain
        except Exception as e:
            logging.error(f"Error creating manager chain: {str(e)}")
            return MockManagerChain(mode, agents)
    
    def create_agent_executor(self, agent_config, tools=None):
        """Create a more advanced agent executor with tools"""
        try:
            if not tools:
                tools = []
            
            # Create a prompt template for the agent
            prefix = f"""
            You are {agent_config['name']}, a {agent_config['role']} with a {agent_config['personality']} personality.
            
            {agent_config['system_instructions']}
            
            You have access to the following tools:
            """
            
            suffix = f"""
            Current conversation:
            {{chat_history}}
            
            Human: {{input}}
            {agent_config['name']}:
            """
            
            # Create the prompt
            prompt = ZeroShotAgent.create_prompt(
                tools, 
                prefix=prefix, 
                suffix=suffix,
                input_variables=["chat_history", "input"]
            )
            
            # Create memory for conversation history
            memory = ConversationBufferMemory(memory_key="chat_history")
            
            # Create the agent
            if self.llm:
                llm_chain = LLMChain(llm=self.llm, prompt=prompt)
                agent = ZeroShotAgent(llm_chain=llm_chain, tools=tools, verbose=True)
                agent_executor = AgentExecutor.from_agent_and_tools(
                    agent=agent,
                    tools=tools,
                    verbose=True,
                    memory=memory
                )
            else:
                # Mock implementation for development
                agent_executor = MockAgentExecutor(agent_config, tools)
            
            return agent_executor
        except Exception as e:
            logging.error(f"Error creating agent executor: {str(e)}")
            return MockAgentExecutor(agent_config, tools)
    
    def generate_response(self, chain, input_text):
        """Generate a response using the provided chain"""
        try:
            if isinstance(chain, (MockAgentChain, MockManagerChain, MockAgentExecutor)):
                return chain.run(input=input_text)
            
            return chain.run(input=input_text)
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            return "I'm sorry, I encountered an error processing your request."
    
    def resolve_conflict(self, responses, context):
        """Resolve conflicts between agent responses"""
        try:
            # Create a prompt for conflict resolution
            prompt = f"""
            You need to resolve a conflict between multiple agent responses.
            
            Context: {context}
            
            Agent responses:
            {responses}
            
            Resolve the conflict by:
            1. Identifying the key points of disagreement
            2. Evaluating the evidence provided by each agent
            3. Determining the most accurate or helpful response
            
            Resolution:
            """
            
            # Use the LLM directly for conflict resolution
            if self.llm:
                resolution = self.llm(prompt)
            else:
                # Mock implementation for development
                resolution = "After analyzing the different perspectives, I've determined that the most accurate response is a combination of the key points from each agent."
            
            return resolution
        except Exception as e:
            logging.error(f"Error resolving conflict: {str(e)}")
            return "I'm sorry, I encountered an error resolving the conflict."


class MockAgentChain:
    """Mock implementation of an agent chain for development without API keys"""
    
    def __init__(self, agent_config):
        self.agent_config = agent_config
        
    def run(self, input):
        """Generate a mock response based on agent configuration"""
        name = self.agent_config.get('name', 'Agent')
        role = self.agent_config.get('role', 'Assistant')
        personality = self.agent_config.get('personality', 'Helpful')
        
        return f"[MOCK {name}] As a {personality} {role}, I would respond to '{input}' with a detailed and helpful answer based on my expertise."


class MockManagerChain:
    """Mock implementation of a manager chain for development without API keys"""
    
    def __init__(self, mode, agents=None):
        self.mode = mode
        self.agents = agents or []
        
    def run(self, input):
        """Generate a mock manager response"""
        if self.mode == "collaborative":
            return f"[MOCK Manager] I'll coordinate a collaborative approach to address: '{input}'. Let's work together on this."
        else:  # strict mode
            if self.agents:
                agent = self.agents[0]
                return f"[MOCK Manager] I'm assigning this task to {agent['name']} who specializes in {agent['role']}. Please address: '{input}'."
            else:
                return f"[MOCK Manager] I'll assign specific tasks to each agent to address: '{input}'."


class MockAgentExecutor:
    """Mock implementation of an agent executor for development without API keys"""
    
    def __init__(self, agent_config, tools=None):
        self.agent_config = agent_config
        self.tools = tools or []
        
    def run(self, input):
        """Generate a mock response based on agent configuration and tools"""
        name = self.agent_config.get('name', 'Agent')
        role = self.agent_config.get('role', 'Assistant')
        personality = self.agent_config.get('personality', 'Helpful')
        
        tool_names = [tool.name for tool in self.tools] if self.tools else []
        tool_str = ", ".join(tool_names) if tool_names else "no tools"
        
        return f"[MOCK {name}] As a {personality} {role} with access to {tool_str}, I would respond to '{input}' with a detailed and helpful answer based on my expertise."
