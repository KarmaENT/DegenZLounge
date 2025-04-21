from flask import Blueprint, request, jsonify
from app.services.ai_providers import AIModelManager, GeminiProvider, DeepSeekProvider, HuggingFaceProvider, OpenRouterProvider, AnthropicProvider, MistralAIProvider, PerplexityProvider, GrokProvider, OllamaProvider
import os
import json

ai_routes = Blueprint('ai_routes', __name__)

# Initialize AI Model Manager
model_manager = AIModelManager()

# Register providers based on available API keys
try:
    if os.environ.get("GEMINI_API_KEY"):
        model_manager.register_provider(GeminiProvider(os.environ.get("GEMINI_API_KEY")), is_default=True)
    
    if os.environ.get("DEEPSEEK_API_KEY"):
        model_manager.register_provider(DeepSeekProvider(os.environ.get("DEEPSEEK_API_KEY")))
    
    if os.environ.get("HUGGINGFACE_API_KEY"):
        model_manager.register_provider(HuggingFaceProvider(os.environ.get("HUGGINGFACE_API_KEY")))
    
    if os.environ.get("OPENROUTER_API_KEY"):
        model_manager.register_provider(OpenRouterProvider(os.environ.get("OPENROUTER_API_KEY")))
    
    if os.environ.get("ANTHROPIC_API_KEY"):
        model_manager.register_provider(AnthropicProvider(os.environ.get("ANTHROPIC_API_KEY")))
    
    if os.environ.get("MISTRAL_API_KEY"):
        model_manager.register_provider(MistralAIProvider(os.environ.get("MISTRAL_API_KEY")))
    
    if os.environ.get("PERPLEXITY_API_KEY"):
        model_manager.register_provider(PerplexityProvider(os.environ.get("PERPLEXITY_API_KEY")))
    
    if os.environ.get("GROK_API_KEY"):
        model_manager.register_provider(GrokProvider(os.environ.get("GROK_API_KEY")))
    
    # Try to register Ollama if it's available
    try:
        ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")
        ollama = OllamaProvider(ollama_url)
        # Test connection
        ollama.get_available_models()
        model_manager.register_provider(ollama)
    except Exception as e:
        print(f"Ollama not available: {e}")
        
except Exception as e:
    print(f"Error initializing AI providers: {e}")

@ai_routes.route('/providers', methods=['GET'])
def get_providers():
    """Get all available AI providers and models."""
    providers_data = []
    models_data = []
    
    for provider_name, provider in model_manager.get_all_providers().items():
        # Add provider info
        providers_data.append({
            'id': provider_name.lower().replace(' ', ''),
            'name': provider_name,
            'description': f"{provider_name} AI models",
            'hasFreeTier': provider.has_free_tier,
            'supportsStreaming': provider.supports_streaming
        })
        
        # Add models for this provider
        provider_models = provider.get_available_models()
        for model in provider_models:
            models_data.append({
                'id': model['id'],
                'name': model['name'],
                'description': model.get('description', ''),
                'contextLength': model.get('context_length', 2048),
                'pricing': model.get('pricing', 'Pay per token'),
                'providerId': provider_name.lower().replace(' ', '')
            })
    
    return jsonify({
        'providers': providers_data,
        'models': models_data
    })

@ai_routes.route('/generate', methods=['POST'])
def generate_text():
    """Generate text using the specified provider and model."""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    
    provider_name = data.get('provider')
    model = data.get('model')
    system_message = data.get('systemMessage')
    temperature = data.get('temperature', 0.7)
    max_tokens = data.get('maxTokens', 1000)
    stream = data.get('stream', False)
    
    try:
        # If no provider specified but model is, find the provider for that model
        if not provider_name and model:
            for provider, provider_obj in model_manager.get_all_providers().items():
                provider_models = [m['id'] for m in provider_obj.get_available_models()]
                if model in provider_models:
                    provider_name = provider
                    break
        
        # If free tier only is requested, find the best free provider
        use_free_tier = data.get('useFreeTier', False)
        if use_free_tier and not provider_name:
            provider_name = model_manager.find_best_free_provider()
            if not provider_name:
                return jsonify({'error': 'No free tier providers available'}), 400
        
        response = model_manager.generate_text(
            prompt=prompt,
            system_message=system_message,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            provider_name=provider_name,
            model=model
        )
        
        # Get usage statistics
        usage = model_manager.get_usage_stats()
        
        return jsonify({
            'text': response,
            'usage': {
                'totalTokens': usage['total_tokens'],
                'provider': provider_name or model_manager.default_provider
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_routes.route('/usage', methods=['GET'])
def get_usage():
    """Get current usage statistics."""
    return jsonify(model_manager.get_usage_stats())

@ai_routes.route('/usage/reset', methods=['POST'])
def reset_usage():
    """Reset usage statistics."""
    model_manager.reset_usage_stats()
    return jsonify({'message': 'Usage statistics reset successfully'})

@ai_routes.route('/free-providers', methods=['GET'])
def get_free_providers():
    """Get all providers with free tiers."""
    free_providers = model_manager.get_free_tier_providers()
    
    providers_data = []
    for provider_name, provider in free_providers.items():
        providers_data.append({
            'id': provider_name.lower().replace(' ', ''),
            'name': provider_name,
            'description': f"{provider_name} AI models",
            'hasFreeTier': True,
            'supportsStreaming': provider.supports_streaming
        })
    
    return jsonify({'providers': providers_data})
