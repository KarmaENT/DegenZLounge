import unittest
from unittest.mock import patch, MagicMock
import os
import json
from app.services.ai_providers import (
    AIModelProvider, GeminiProvider, DeepSeekProvider, HuggingFaceProvider,
    OpenRouterProvider, AnthropicProvider, MistralAIProvider, PerplexityProvider,
    GrokProvider, OllamaProvider, AIModelManager
)

class TestAIProviders(unittest.TestCase):
    def setUp(self):
        # Mock API keys for testing
        os.environ["GEMINI_API_KEY"] = "test_gemini_key"
        os.environ["DEEPSEEK_API_KEY"] = "test_deepseek_key"
        os.environ["HUGGINGFACE_API_KEY"] = "test_huggingface_key"
        os.environ["OPENROUTER_API_KEY"] = "test_openrouter_key"
        os.environ["ANTHROPIC_API_KEY"] = "test_anthropic_key"
        os.environ["MISTRAL_API_KEY"] = "test_mistral_key"
        os.environ["PERPLEXITY_API_KEY"] = "test_perplexity_key"
        os.environ["GROK_API_KEY"] = "test_grok_key"
        
        # Initialize providers
        self.gemini = GeminiProvider()
        self.deepseek = DeepSeekProvider()
        self.huggingface = HuggingFaceProvider()
        self.openrouter = OpenRouterProvider()
        self.anthropic = AnthropicProvider()
        self.mistral = MistralAIProvider()
        self.perplexity = PerplexityProvider()
        self.grok = GrokProvider()
        
        # Initialize manager
        self.manager = AIModelManager()
        self.manager.register_provider(self.gemini, is_default=True)
        self.manager.register_provider(self.deepseek)
        self.manager.register_provider(self.huggingface)
        self.manager.register_provider(self.openrouter)
        self.manager.register_provider(self.anthropic)
        self.manager.register_provider(self.mistral)
        self.manager.register_provider(self.perplexity)
        self.manager.register_provider(self.grok)
        
        # Try to initialize Ollama if available
        try:
            self.ollama = OllamaProvider("http://localhost:11434")
            self.manager.register_provider(self.ollama)
        except:
            self.ollama = None
    
    def test_provider_initialization(self):
        """Test that all providers initialize correctly."""
        self.assertEqual(self.gemini.provider_name, "Gemini")
        self.assertEqual(self.deepseek.provider_name, "DeepSeek")
        self.assertEqual(self.huggingface.provider_name, "Hugging Face")
        self.assertEqual(self.openrouter.provider_name, "OpenRouter")
        self.assertEqual(self.anthropic.provider_name, "Anthropic")
        self.assertEqual(self.mistral.provider_name, "Mistral AI")
        self.assertEqual(self.perplexity.provider_name, "Perplexity")
        self.assertEqual(self.grok.provider_name, "Grok")
        
        if self.ollama:
            self.assertEqual(self.ollama.provider_name, "Ollama")
    
    def test_free_tier_providers(self):
        """Test identification of free tier providers."""
        free_providers = self.manager.get_free_tier_providers()
        
        # These providers should have free tiers
        self.assertIn("Gemini", free_providers)
        self.assertIn("DeepSeek", free_providers)
        self.assertIn("Hugging Face", free_providers)
        self.assertIn("OpenRouter", free_providers)
        self.assertIn("Mistral AI", free_providers)
        self.assertIn("Perplexity", free_providers)
        
        # These providers should not have free tiers
        self.assertNotIn("Anthropic", free_providers)
        self.assertNotIn("Grok", free_providers)
        
        if self.ollama:
            self.assertIn("Ollama", free_providers)
    
    def test_streaming_support(self):
        """Test identification of streaming support."""
        self.assertTrue(self.gemini.supports_streaming)
        self.assertTrue(self.deepseek.supports_streaming)
        self.assertFalse(self.huggingface.supports_streaming)
        self.assertTrue(self.openrouter.supports_streaming)
        self.assertTrue(self.anthropic.supports_streaming)
        self.assertTrue(self.mistral.supports_streaming)
        self.assertTrue(self.perplexity.supports_streaming)
        self.assertTrue(self.grok.supports_streaming)
        
        if self.ollama:
            self.assertTrue(self.ollama.supports_streaming)
    
    def test_available_models(self):
        """Test that all providers return available models."""
        for provider in self.manager.get_all_providers().values():
            models = provider.get_available_models()
            self.assertIsInstance(models, list)
            self.assertGreater(len(models), 0)
            
            # Check model structure
            for model in models:
                self.assertIn('id', model)
                self.assertIn('name', model)
                self.assertIn('description', model)
    
    @patch('requests.post')
    def test_gemini_generate_text(self, mock_post):
        """Test Gemini text generation."""
        # Mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "This is a test response from Gemini."
                            }
                        ]
                    }
                }
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        # Test generate_text
        response = self.gemini.generate_text(
            prompt="Test prompt",
            system_message="You are a helpful assistant",
            temperature=0.7,
            max_tokens=100
        )
        
        # Verify response
        self.assertEqual(response, "This is a test response from Gemini.")
        
        # Verify API call
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertIn("generativelanguage.googleapis.com", args[0])
        self.assertIn("temperature", kwargs["json"]["generationConfig"])
        self.assertIn("maxOutputTokens", kwargs["json"]["generationConfig"])
    
    @patch('requests.post')
    def test_deepseek_generate_text(self, mock_post):
        """Test DeepSeek text generation."""
        # Mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "This is a test response from DeepSeek."
                    }
                }
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        # Test generate_text
        response = self.deepseek.generate_text(
            prompt="Test prompt",
            system_message="You are a helpful assistant",
            temperature=0.7,
            max_tokens=100
        )
        
        # Verify response
        self.assertEqual(response, "This is a test response from DeepSeek.")
        
        # Verify API call
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertIn("api.deepseek.ai", args[0])
        self.assertIn("messages", kwargs["json"])
        self.assertIn("temperature", kwargs["json"])
        self.assertIn("max_tokens", kwargs["json"])
    
    def test_token_usage_estimation(self):
        """Test token usage estimation."""
        prompt = "This is a test prompt with approximately 10 tokens."
        response = "This is a test response with approximately 10 tokens as well."
        
        for provider in self.manager.get_all_providers().values():
            usage = provider.get_token_usage(prompt, response)
            
            self.assertIn("prompt_tokens", usage)
            self.assertIn("completion_tokens", usage)
            self.assertIn("total_tokens", usage)
            
            self.assertGreater(usage["prompt_tokens"], 0)
            self.assertGreater(usage["completion_tokens"], 0)
            self.assertEqual(usage["total_tokens"], usage["prompt_tokens"] + usage["completion_tokens"])
    
    def test_manager_functionality(self):
        """Test AIModelManager functionality."""
        # Test getting providers
        providers = self.manager.get_all_providers()
        self.assertGreaterEqual(len(providers), 8)  # At least 8 providers
        
        # Test default provider
        self.assertEqual(self.manager.default_provider, "Gemini")
        
        # Test changing default provider
        self.manager.set_default_provider("Mistral AI")
        self.assertEqual(self.manager.default_provider, "Mistral AI")
        
        # Test getting provider
        provider = self.manager.get_provider("DeepSeek")
        self.assertEqual(provider.provider_name, "DeepSeek")
        
        # Test getting all models
        models = self.manager.get_all_models()
        self.assertGreaterEqual(len(models), 8)  # At least 8 providers
        
        # Test usage stats
        stats = self.manager.get_usage_stats()
        self.assertEqual(stats["total_tokens"], 0)  # No usage yet
        
        # Test reset usage stats
        self.manager.reset_usage_stats()
        stats = self.manager.get_usage_stats()
        self.assertEqual(stats["total_tokens"], 0)
        
        # Test finding best free provider
        free_provider = self.manager.find_best_free_provider()
        self.assertIsNotNone(free_provider)
        self.assertIn(free_provider, ["Gemini", "DeepSeek", "Hugging Face", "OpenRouter", "Mistral AI", "Perplexity", "Ollama"])
    
    @patch('app.services.ai_providers.AIModelProvider.generate_text')
    def test_manager_generate_text(self, mock_generate):
        """Test AIModelManager generate_text functionality."""
        # Mock provider generate_text
        mock_generate.return_value = "This is a test response from the manager."
        
        # Test generate_text with default provider
        response = self.manager.generate_text(
            prompt="Test prompt",
            system_message="You are a helpful assistant",
            temperature=0.7,
            max_tokens=100
        )
        
        # Verify response
        self.assertEqual(response, "This is a test response from the manager.")
        
        # Verify provider was called
        mock_generate.assert_called_once()
        
        # Test usage stats were updated
        stats = self.manager.get_usage_stats()
        self.assertGreater(stats["total_tokens"], 0)

if __name__ == '__main__':
    unittest.main()
