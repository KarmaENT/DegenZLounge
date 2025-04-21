import unittest
from unittest.mock import patch, MagicMock
from app.services.ai_service import AIService
from app.services.agent_tools import WebSearchTool, DocumentRetrievalTool
from app.models.agent import Agent
from app.models.sandbox import Sandbox, Message

class TestAIService(unittest.TestCase):
    def setUp(self):
        self.ai_service = AIService()
        
        # Mock agent
        self.agent = Agent(
            id=1,
            name="Test Agent",
            role="Assistant",
            personality="Helpful and friendly",
            specialization="General assistance",
            system_instructions="Be helpful and concise",
            examples="User: Hello\nAssistant: Hi there! How can I help you today?",
            user_id=1
        )
        
        # Mock sandbox
        self.sandbox = Sandbox(
            id=1,
            name="Test Sandbox",
            description="A test sandbox",
            mode="collaborative",
            user_id=1
        )
        
        # Mock message
        self.message = Message(
            id=1,
            content="Hello, can you help me with a research task?",
            sender_type="user",
            sender_id=1,
            sandbox_id=1
        )
    
    @patch('app.services.ai_service.LLMChain')
    def test_create_agent_chain(self, mock_llm_chain):
        # Mock LLMChain
        mock_chain = MagicMock()
        mock_llm_chain.return_value = mock_chain
        mock_chain.run.return_value = "Hi there! I'm Test Agent. How can I help you today?"
        
        # Create agent chain
        chain = self.ai_service.create_agent_chain(self.agent)
        
        # Assert chain was created
        self.assertEqual(chain, mock_chain)
        
        # Test chain response
        response = chain.run("Hello")
        self.assertEqual(response, "Hi there! I'm Test Agent. How can I help you today?")
    
    @patch('app.services.ai_service.LLMChain')
    def test_create_manager_chain(self, mock_llm_chain):
        # Mock LLMChain
        mock_chain = MagicMock()
        mock_llm_chain.return_value = mock_chain
        mock_chain.run.return_value = "I'll assign this task to the Research Agent."
        
        # Create manager chain
        chain = self.ai_service.create_manager_chain(self.sandbox)
        
        # Assert chain was created
        self.assertEqual(chain, mock_chain)
        
        # Test chain response
        response = chain.run("I need to research eco-friendly materials")
        self.assertEqual(response, "I'll assign this task to the Research Agent.")
    
    @patch('app.services.ai_service.LLMChain')
    def test_generate_agent_response(self, mock_llm_chain):
        # Mock LLMChain
        mock_chain = MagicMock()
        mock_llm_chain.return_value = mock_chain
        mock_chain.run.return_value = "I'd be happy to help with your research task. What topic are you interested in?"
        
        # Mock get_agent_chain
        self.ai_service.get_agent_chain = MagicMock(return_value=mock_chain)
        
        # Generate agent response
        response = self.ai_service.generate_agent_response(self.agent, self.message, self.sandbox)
        
        # Assert response
        self.assertEqual(response, "I'd be happy to help with your research task. What topic are you interested in?")
        
        # Assert get_agent_chain was called
        self.ai_service.get_agent_chain.assert_called_once_with(self.agent)
    
    @patch('app.services.ai_service.LLMChain')
    def test_generate_manager_response(self, mock_llm_chain):
        # Mock LLMChain
        mock_chain = MagicMock()
        mock_llm_chain.return_value = mock_chain
        mock_chain.run.return_value = "I'll coordinate this research task. Let me assign it to the appropriate agents."
        
        # Mock get_manager_chain
        self.ai_service.get_manager_chain = MagicMock(return_value=mock_chain)
        
        # Generate manager response
        response = self.ai_service.generate_manager_response(self.sandbox, self.message)
        
        # Assert response
        self.assertEqual(response, "I'll coordinate this research task. Let me assign it to the appropriate agents.")
        
        # Assert get_manager_chain was called
        self.ai_service.get_manager_chain.assert_called_once_with(self.sandbox)
    
    def test_resolve_conflict(self):
        # Mock agent responses
        agent1_response = "I think we should use recycled plastic for the eco-friendly shoes."
        agent2_response = "I believe bamboo would be a better material for eco-friendly shoes."
        
        # Mock conflict resolution
        with patch.object(self.ai_service, 'generate_conflict_resolution') as mock_resolve:
            mock_resolve.return_value = "After analyzing both suggestions, bamboo would be the better choice because it's more sustainable and biodegradable."
            
            # Resolve conflict
            resolution = self.ai_service.resolve_conflict([agent1_response, agent2_response], "What material should we use for eco-friendly shoes?")
            
            # Assert resolution
            self.assertEqual(resolution, "After analyzing both suggestions, bamboo would be the better choice because it's more sustainable and biodegradable.")
            
            # Assert generate_conflict_resolution was called
            mock_resolve.assert_called_once()

class TestAgentTools(unittest.TestCase):
    def setUp(self):
        self.web_search_tool = WebSearchTool()
        self.document_retrieval_tool = DocumentRetrievalTool()
    
    @patch('app.services.agent_tools.requests.get')
    def test_web_search_tool(self, mock_get):
        # Mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'items': [
                {
                    'title': 'Eco-friendly Materials for Sustainable Fashion',
                    'link': 'https://example.com/eco-materials',
                    'snippet': 'Bamboo, recycled plastic, and organic cotton are popular eco-friendly materials.'
                }
            ]
        }
        mock_get.return_value = mock_response
        
        # Execute search
        result = self.web_search_tool.execute("eco-friendly materials for shoes")
        
        # Assert result
        self.assertIn("Eco-friendly Materials for Sustainable Fashion", result)
        self.assertIn("https://example.com/eco-materials", result)
        self.assertIn("Bamboo, recycled plastic, and organic cotton", result)
    
    def test_document_retrieval_tool(self):
        # Mock document database
        self.document_retrieval_tool.documents = {
            'eco-materials': "Bamboo is a sustainable material with a low environmental impact. Recycled plastic helps reduce waste. Organic cotton uses fewer chemicals."
        }
        
        # Execute retrieval
        result = self.document_retrieval_tool.execute("Tell me about bamboo as a material")
        
        # Assert result
        self.assertIn("Bamboo is a sustainable material", result)
        self.assertIn("low environmental impact", result)

if __name__ == '__main__':
    unittest.main()
