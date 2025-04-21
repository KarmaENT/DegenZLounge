import unittest
from unittest.mock import patch, MagicMock
from app.api.ai_routes import ai_routes
from app.api.api_key_routes import api_key_routes
from flask import Flask, json

class TestAIRoutes(unittest.TestCase):
    def setUp(self):
        # Create a Flask app for testing
        self.app = Flask(__name__)
        self.app.register_blueprint(ai_routes, url_prefix='/api/ai')
        self.app.register_blueprint(api_key_routes, url_prefix='/api/ai')
        self.client = self.app.test_client()
        
        # Mock environment variables
        self.env_patcher = patch.dict('os.environ', {
            'GEMINI_API_KEY': 'test_key',
            'DEEPSEEK_API_KEY': 'test_key',
            'HUGGINGFACE_API_KEY': 'test_key',
            'OPENROUTER_API_KEY': 'test_key',
            'MISTRAL_API_KEY': 'test_key',
            'PERPLEXITY_API_KEY': 'test_key'
        })
        self.env_patcher.start()
    
    def tearDown(self):
        self.env_patcher.stop()
    
    def test_get_providers(self):
        """Test the /providers endpoint."""
        response = self.client.get('/api/ai/providers')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('providers', data)
        self.assertIn('models', data)
        
        # Check that we have providers
        self.assertGreater(len(data['providers']), 0)
        
        # Check provider structure
        for provider in data['providers']:
            self.assertIn('id', provider)
            self.assertIn('name', provider)
            self.assertIn('description', provider)
            self.assertIn('hasFreeTier', provider)
            self.assertIn('supportsStreaming', provider)
        
        # Check that we have models
        self.assertGreater(len(data['models']), 0)
        
        # Check model structure
        for model in data['models']:
            self.assertIn('id', model)
            self.assertIn('name', model)
            self.assertIn('description', model)
            self.assertIn('contextLength', model)
            self.assertIn('pricing', model)
            self.assertIn('providerId', model)
    
    @patch('app.api.ai_routes.model_manager.generate_text')
    def test_generate_text(self, mock_generate):
        """Test the /generate endpoint."""
        # Mock the generate_text method
        mock_generate.return_value = "This is a test response."
        
        # Test with provider and model
        response = self.client.post('/api/ai/generate', json={
            'prompt': 'Test prompt',
            'provider': 'gemini',
            'model': 'gemini-flash-2.0',
            'systemMessage': 'You are a helpful assistant',
            'temperature': 0.7,
            'maxTokens': 100
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('text', data)
        self.assertEqual(data['text'], "This is a test response.")
        self.assertIn('usage', data)
        
        # Test with missing prompt
        response = self.client.post('/api/ai/generate', json={
            'provider': 'gemini',
            'model': 'gemini-flash-2.0'
        })
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        
        # Test with free tier only
        response = self.client.post('/api/ai/generate', json={
            'prompt': 'Test prompt',
            'useFreeTier': True
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('text', data)
    
    def test_get_usage(self):
        """Test the /usage endpoint."""
        response = self.client.get('/api/ai/usage')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('total_tokens', data)
        self.assertIn('providers', data)
    
    def test_reset_usage(self):
        """Test the /usage/reset endpoint."""
        response = self.client.post('/api/ai/usage/reset')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('message', data)
    
    def test_get_free_providers(self):
        """Test the /free-providers endpoint."""
        response = self.client.get('/api/ai/free-providers')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('providers', data)
        
        # Check that we have free providers
        self.assertGreater(len(data['providers']), 0)
        
        # Check that all providers have free tier
        for provider in data['providers']:
            self.assertTrue(provider['hasFreeTier'])
    
    def test_save_api_key(self):
        """Test the /api-keys endpoint (POST)."""
        response = self.client.post('/api/ai/api-keys', json={
            'provider': 'gemini',
            'apiKey': 'new_test_key'
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        
        # Test with missing data
        response = self.client.post('/api/ai/api-keys', json={})
        self.assertEqual(response.status_code, 400)
        
        # Test with missing provider
        response = self.client.post('/api/ai/api-keys', json={
            'apiKey': 'test_key'
        })
        self.assertEqual(response.status_code, 400)
        
        # Test with missing API key
        response = self.client.post('/api/ai/api-keys', json={
            'provider': 'gemini'
        })
        self.assertEqual(response.status_code, 400)
    
    def test_get_api_keys(self):
        """Test the /api-keys endpoint (GET)."""
        # First save an API key
        self.client.post('/api/ai/api-keys', json={
            'provider': 'gemini',
            'apiKey': 'test_key'
        })
        
        # Then get the list of providers with keys
        response = self.client.get('/api/ai/api-keys')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('providers', data)
        self.assertIn('gemini', data['providers'])
    
    def test_delete_api_key(self):
        """Test the /api-keys/<provider> endpoint (DELETE)."""
        # First save an API key
        self.client.post('/api/ai/api-keys', json={
            'provider': 'gemini',
            'apiKey': 'test_key'
        })
        
        # Then delete it
        response = self.client.delete('/api/ai/api-keys/gemini')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('message', data)
        
        # Test deleting a non-existent key
        response = self.client.delete('/api/ai/api-keys/nonexistent')
        self.assertEqual(response.status_code, 404)
    
    def test_get_free_credits(self):
        """Test the /free-credits endpoint."""
        response = self.client.get('/api/ai/free-credits')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('free_credits', data)
        
        # Check structure of free credits
        for provider, info in data['free_credits'].items():
            self.assertIn('available', info)
            self.assertIn('credits', info)
            self.assertIn('reset_period', info)
            self.assertIn('usage_limit', info)
    
    def test_optimize_usage(self):
        """Test the /optimize-usage endpoint."""
        response = self.client.post('/api/ai/optimize-usage', json={
            'prompt': 'This is a test prompt that needs optimization. Please could you help me with this complex task?'
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn('original_tokens', data)
        self.assertIn('suggestions', data)
        
        # Test with missing prompt
        response = self.client.post('/api/ai/optimize-usage', json={})
        self.assertEqual(response.status_code, 400)
    
    def test_get_cache_status(self):
        """Test the /cache-status endpoint."""
        response = self.client.get('/api/ai/cache-status')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('cache', data)
        
        # Check cache structure
        cache = data['cache']
        self.assertIn('enabled', cache)
        self.assertIn('size', cache)
        self.assertIn('hit_rate', cache)
        self.assertIn('savings', cache)
    
    def test_clear_cache(self):
        """Test the /cache endpoint (DELETE)."""
        response = self.client.delete('/api/ai/cache')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('message', data)

if __name__ == '__main__':
    unittest.main()
