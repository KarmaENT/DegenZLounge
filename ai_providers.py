import os
import json
import requests
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union

class AIModelProvider(ABC):
    """Abstract base class for AI model providers."""
    
    @abstractmethod
    def generate_text(self, prompt: str, system_message: str = None, 
                     temperature: float = 0.7, max_tokens: int = 1000, 
                     stream: bool = False, **kwargs) -> str:
        """Generate text from the model."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from this provider."""
        pass
    
    @abstractmethod
    def get_token_usage(self, prompt: str, response: str) -> Dict[str, int]:
        """Get token usage for a prompt and response."""
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get the name of the provider."""
        pass
    
    @property
    @abstractmethod
    def has_free_tier(self) -> bool:
        """Check if the provider has a free tier."""
        pass
    
    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        """Check if the provider supports streaming responses."""
        pass

class GeminiProvider(AIModelProvider):
    """Provider for Google's Gemini models."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key is required")
        
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.models = {
            "gemini-flash-2.0": "models/gemini-flash-2.0:generateContent",
            "gemini-pro": "models/gemini-pro:generateContent",
            "gemini-ultra": "models/gemini-ultra:generateContent"
        }
        self.default_model = "gemini-flash-2.0"
    
    def generate_text(self, prompt: str, system_message: str = None, 
                     temperature: float = 0.7, max_tokens: int = 1000, 
                     stream: bool = False, model: str = None, **kwargs) -> str:
        """Generate text using Gemini models."""
        model_endpoint = self.models.get(model or self.default_model)
        
        url = f"{self.base_url}/{model_endpoint}?key={self.api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": kwargs.get("top_p", 0.95),
                "topK": kwargs.get("top_k", 40)
            }
        }
        
        if system_message:
            payload["systemInstruction"] = {"parts": [{"text": system_message}]}
        
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        if "candidates" in result and len(result["candidates"]) > 0:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        
        return ""
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available Gemini models."""
        return [
            {
                "id": "gemini-flash-2.0",
                "name": "Gemini Flash 2.0",
                "description": "Fast and efficient model for general tasks",
                "context_length": 32000,
                "pricing": "Free tier available"
            },
            {
                "id": "gemini-pro",
                "name": "Gemini Pro",
                "description": "Balanced model for complex reasoning",
                "context_length": 32000,
                "pricing": "Pay per token"
            },
            {
                "id": "gemini-ultra",
                "name": "Gemini Ultra",
                "description": "Most capable model for complex tasks",
                "context_length": 32000,
                "pricing": "Pay per token"
            }
        ]
    
    def get_token_usage(self, prompt: str, response: str) -> Dict[str, int]:
        """Estimate token usage for Gemini models."""
        # Simple estimation: ~4 characters per token
        prompt_tokens = len(prompt) // 4
        completion_tokens = len(response) // 4
        
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    
    @property
    def provider_name(self) -> str:
        return "Gemini"
    
    @property
    def has_free_tier(self) -> bool:
        return True
    
    @property
    def supports_streaming(self) -> bool:
        return True

class DeepSeekProvider(AIModelProvider):
    """Provider for DeepSeek AI models."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        if not self.api_key:
            raise ValueError("DeepSeek API key is required")
        
        self.base_url = "https://api.deepseek.ai/v1"
        self.models = {
            "deepseek-chat": "chat/completions",
            "deepseek-coder": "code/completions"
        }
        self.default_model = "deepseek-chat"
    
    def generate_text(self, prompt: str, system_message: str = None, 
                     temperature: float = 0.7, max_tokens: int = 1000, 
                     stream: bool = False, model: str = None, **kwargs) -> str:
        """Generate text using DeepSeek models."""
        endpoint = self.models.get(model or self.default_model)
        url = f"{self.base_url}/{endpoint}"
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        
        return ""
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available DeepSeek models."""
        return [
            {
                "id": "deepseek-chat",
                "name": "DeepSeek Chat",
                "description": "General purpose chat model",
                "context_length": 8192,
                "pricing": "Limited free tier available"
            },
            {
                "id": "deepseek-coder",
                "name": "DeepSeek Coder",
                "description": "Specialized for code generation and understanding",
                "context_length": 8192,
                "pricing": "Limited free tier available"
            }
        ]
    
    def get_token_usage(self, prompt: str, response: str) -> Dict[str, int]:
        """Estimate token usage for DeepSeek models."""
        # Simple estimation: ~4 characters per token
        prompt_tokens = len(prompt) // 4
        completion_tokens = len(response) // 4
        
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    
    @property
    def provider_name(self) -> str:
        return "DeepSeek"
    
    @property
    def has_free_tier(self) -> bool:
        return True
    
    @property
    def supports_streaming(self) -> bool:
        return True

class HuggingFaceProvider(AIModelProvider):
    """Provider for Hugging Face models."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("HUGGINGFACE_API_KEY")
        if not self.api_key:
            raise ValueError("Hugging Face API key is required")
        
        self.base_url = "https://api-inference.huggingface.co/models"
        self.default_model = "mistralai/Mistral-7B-Instruct-v0.2"
    
    def generate_text(self, prompt: str, system_message: str = None, 
                     temperature: float = 0.7, max_tokens: int = 1000, 
                     stream: bool = False, model: str = None, **kwargs) -> str:
        """Generate text using Hugging Face models."""
        model_name = model or self.default_model
        url = f"{self.base_url}/{model_name}"
        
        # Format prompt based on model
        formatted_prompt = prompt
        if system_message:
            if "mistral" in model_name.lower():
                formatted_prompt = f"<s>[INST] {system_message}\n\n{prompt} [/INST]"
            elif "llama" in model_name.lower():
                formatted_prompt = f"<s>[INST] <<SYS>>\n{system_message}\n<</SYS>>\n\n{prompt} [/INST]"
            else:
                formatted_prompt = f"{system_message}\n\n{prompt}"
        
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False
            }
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "")
        
        return ""
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available Hugging Face models."""
        return [
            {
                "id": "mistralai/Mistral-7B-Instruct-v0.2",
                "name": "Mistral 7B Instruct",
                "description": "Efficient instruction-following model",
                "context_length": 8192,
                "pricing": "Free with API key"
            },
            {
                "id": "meta-llama/Llama-2-7b-chat-hf",
                "name": "Llama 2 7B Chat",
                "description": "Meta's conversational model",
                "context_length": 4096,
                "pricing": "Free with API key"
            },
            {
                "id": "tiiuae/falcon-7b-instruct",
                "name": "Falcon 7B Instruct",
                "description": "Instruction-tuned model from TII",
                "context_length": 2048,
                "pricing": "Free with API key"
            }
        ]
    
    def get_token_usage(self, prompt: str, response: str) -> Dict[str, int]:
        """Estimate token usage for Hugging Face models."""
        # Simple estimation: ~4 characters per token
        prompt_tokens = len(prompt) // 4
        completion_tokens = len(response) // 4
        
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    
    @property
    def provider_name(self) -> str:
        return "Hugging Face"
    
    @property
    def has_free_tier(self) -> bool:
        return True
    
    @property
    def supports_streaming(self) -> bool:
        return False

class OpenRouterProvider(AIModelProvider):
    """Provider for OpenRouter models."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenRouter API key is required")
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.default_model = "openai/gpt-3.5-turbo"
    
    def generate_text(self, prompt: str, system_message: str = None, 
                     temperature: float = 0.7, max_tokens: int = 1000, 
                     stream: bool = False, model: str = None, **kwargs) -> str:
        """Generate text using OpenRouter models."""
        url = f"{self.base_url}/chat/completions"
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://degenz-lounge.com",  # Required by OpenRouter
            "X-Title": "DeGeNz Lounge"  # Required by OpenRouter
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        
        return ""
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available OpenRouter models."""
        # This would typically fetch from OpenRouter's API
        # For now, we'll return a static list of popular models
        return [
            {
                "id": "openai/gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "description": "Fast and efficient model from OpenAI",
                "context_length": 16385,
                "pricing": "Pay per token, with free credits for new users"
            },
            {
                "id": "anthropic/claude-3-haiku",
                "name": "Claude 3 Haiku",
                "description": "Fast and efficient model from Anthropic",
                "context_length": 200000,
                "pricing": "Pay per token, with free credits for new users"
            },
            {
                "id": "mistralai/mistral-7b-instruct",
                "name": "Mistral 7B Instruct",
                "description": "Efficient open-source model",
                "context_length": 8192,
                "pricing": "Pay per token, with free credits for new users"
            }
        ]
    
    def get_token_usage(self, prompt: str, response: str) -> Dict[str, int]:
        """Get token usage from OpenRouter response."""
        # In a real implementation, this would parse the usage from the API response
        # For now, we'll use a simple estimation
        prompt_tokens = len(prompt) // 4
        completion_tokens = len(response) // 4
        
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    
    @property
    def provider_name(self) -> str:
        return "OpenRouter"
    
    @property
    def has_free_tier(self) -> bool:
        return True
    
    @property
    def supports_streaming(self) -> bool:
        return True

class AnthropicProvider(AIModelProvider):
    """Provider for Anthropic Claude models."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key is required")
   
(Content truncated due to size limit. Use line ranges to read in chunks)