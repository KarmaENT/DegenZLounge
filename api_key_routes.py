from flask import Blueprint, request, jsonify
import os
import json
from app.services.ai_providers import AIModelManager

api_key_routes = Blueprint('api_key_routes', __name__)

# Dictionary to store user-provided API keys (in a real app, these would be stored in a database)
user_api_keys = {}

@api_key_routes.route('/api-keys', methods=['POST'])
def save_api_key():
    """Save a user-provided API key for a specific provider."""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    provider = data.get('provider')
    api_key = data.get('apiKey')
    
    if not provider or not api_key:
        return jsonify({'error': 'Provider and API key are required'}), 400
    
    # Store the API key (in a real app, this would be encrypted and stored in a database)
    user_api_keys[provider] = api_key
    
    # Set the API key as an environment variable for the current session
    os.environ[f"{provider.upper()}_API_KEY"] = api_key
    
    return jsonify({'message': f'API key for {provider} saved successfully'})

@api_key_routes.route('/api-keys', methods=['GET'])
def get_api_keys():
    """Get a list of providers for which the user has provided API keys."""
    providers_with_keys = list(user_api_keys.keys())
    
    return jsonify({'providers': providers_with_keys})

@api_key_routes.route('/api-keys/<provider>', methods=['DELETE'])
def delete_api_key(provider):
    """Delete a user-provided API key for a specific provider."""
    if provider in user_api_keys:
        del user_api_keys[provider]
        
        # Remove the API key from environment variables
        if f"{provider.upper()}_API_KEY" in os.environ:
            del os.environ[f"{provider.upper()}_API_KEY"]
        
        return jsonify({'message': f'API key for {provider} deleted successfully'})
    
    return jsonify({'error': f'No API key found for {provider}'}), 404

@api_key_routes.route('/free-credits', methods=['GET'])
def get_free_credits():
    """Get information about available free credits for each provider."""
    # In a real app, this would query the actual free credit status from each provider
    # For now, we'll return mock data
    free_credits = {
        'gemini': {
            'available': True,
            'credits': 'Unlimited for basic usage',
            'reset_period': 'N/A',
            'usage_limit': '60 requests per minute'
        },
        'deepseek': {
            'available': True,
            'credits': '10,000 tokens',
            'reset_period': 'Monthly',
            'usage_limit': '3 requests per minute'
        },
        'huggingface': {
            'available': True,
            'credits': 'Unlimited for open models',
            'reset_period': 'N/A',
            'usage_limit': '30,000 requests per day'
        },
        'openrouter': {
            'available': True,
            'credits': '$5 free credits for new users',
            'reset_period': 'One-time',
            'usage_limit': 'Based on credit balance'
        },
        'mistral': {
            'available': True,
            'credits': '$5 free credits',
            'reset_period': 'One-time',
            'usage_limit': 'Based on credit balance'
        },
        'perplexity': {
            'available': True,
            'credits': '5,000 tokens per day',
            'reset_period': 'Daily',
            'usage_limit': '100 requests per day'
        },
        'ollama': {
            'available': True,
            'credits': 'Unlimited (self-hosted)',
            'reset_period': 'N/A',
            'usage_limit': 'Based on hardware'
        }
    }
    
    return jsonify({'free_credits': free_credits})

@api_key_routes.route('/optimize-usage', methods=['POST'])
def optimize_usage():
    """Optimize API usage to maximize free tier usage."""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    # In a real app, this would analyze the prompt and suggest optimizations
    # For now, we'll return mock suggestions
    
    # Calculate approximate token count (rough estimate)
    token_count = len(prompt.split())
    
    optimizations = {
        'original_tokens': token_count,
        'suggestions': []
    }
    
    # Add suggestions based on token count
    if token_count > 500:
        optimizations['suggestions'].append({
            'type': 'shorten',
            'description': 'Shorten the prompt to reduce token usage',
            'potential_savings': f'~{int(token_count * 0.3)} tokens'
        })
    
    if "please" in prompt.lower() or "could you" in prompt.lower():
        optimizations['suggestions'].append({
            'type': 'remove_politeness',
            'description': 'Remove unnecessary politeness phrases',
            'potential_savings': '5-10 tokens'
        })
    
    if token_count > 200:
        optimizations['suggestions'].append({
            'type': 'split_requests',
            'description': 'Split into multiple smaller requests',
            'potential_savings': 'Better use of context window'
        })
    
    # Recommend the best free model based on the prompt
    if "code" in prompt.lower() or "programming" in prompt.lower():
        optimizations['recommended_model'] = {
            'provider': 'deepseek',
            'model': 'deepseek-coder',
            'reason': 'Specialized for code generation'
        }
    elif token_count > 1000:
        optimizations['recommended_model'] = {
            'provider': 'mistral',
            'model': 'mistral-small-latest',
            'reason': 'Good balance of context length and quality'
        }
    else:
        optimizations['recommended_model'] = {
            'provider': 'gemini',
            'model': 'gemini-flash-2.0',
            'reason': 'Fast and efficient for general tasks'
        }
    
    return jsonify(optimizations)

@api_key_routes.route('/cache-status', methods=['GET'])
def get_cache_status():
    """Get information about the response cache."""
    # In a real app, this would query the actual cache status
    # For now, we'll return mock data
    cache_status = {
        'enabled': True,
        'size': 250,
        'hit_rate': '68%',
        'savings': {
            'tokens': 45000,
            'requests': 250
        }
    }
    
    return jsonify({'cache': cache_status})

@api_key_routes.route('/cache', methods=['DELETE'])
def clear_cache():
    """Clear the response cache."""
    # In a real app, this would actually clear the cache
    # For now, we'll just return a success message
    
    return jsonify({'message': 'Cache cleared successfully'})
