import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the model types
export type ModelProvider = {
  id: string;
  name: string;
  description: string;
  hasFreeTier: boolean;
  supportsStreaming: boolean;
};

export type Model = {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing: string;
  providerId: string;
};

// Define the context type
type AIModelContextType = {
  providers: ModelProvider[];
  models: Model[];
  selectedProvider: string;
  selectedModel: string;
  setSelectedProvider: (providerId: string) => void;
  setSelectedModel: (modelId: string) => void;
  usageStats: {
    totalTokens: number;
    providers: Record<string, {
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      requests: number;
    }>;
  };
  resetUsageStats: () => void;
  isUsingFreeTier: boolean;
  toggleFreeTierOnly: () => void;
  freeTierOnly: boolean;
  getAvailableModels: (providerId?: string) => Model[];
  getProviderForModel: (modelId: string) => ModelProvider | undefined;
};

// Create the context
const AIModelContext = createContext<AIModelContextType | undefined>(undefined);

// Sample data for providers and models
const defaultProviders: ModelProvider[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s multimodal AI models',
    hasFreeTier: true,
    supportsStreaming: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Specialized models with strong coding capabilities',
    hasFreeTier: true,
    supportsStreaming: true,
  },
  {
    id: 'grok',
    name: 'Grok',
    description: 'xAI\'s conversational model with real-time knowledge',
    hasFreeTier: false,
    supportsStreaming: true,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Open-source models with various specializations',
    hasFreeTier: true,
    supportsStreaming: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Gateway to multiple AI models through a single API',
    hasFreeTier: true,
    supportsStreaming: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models with strong reasoning capabilities',
    hasFreeTier: false,
    supportsStreaming: true,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Efficient models with strong reasoning',
    hasFreeTier: true,
    supportsStreaming: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Models with real-time information retrieval',
    hasFreeTier: true,
    supportsStreaming: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Self-hosted open-source models',
    hasFreeTier: true,
    supportsStreaming: true,
  },
];

const defaultModels: Model[] = [
  // Gemini models
  {
    id: 'gemini-flash-2.0',
    name: 'Gemini Flash 2.0',
    description: 'Fast and efficient model for general tasks',
    contextLength: 32000,
    pricing: 'Free tier available',
    providerId: 'gemini',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Balanced model for complex reasoning',
    contextLength: 32000,
    pricing: 'Pay per token',
    providerId: 'gemini',
  },
  {
    id: 'gemini-ultra',
    name: 'Gemini Ultra',
    description: 'Most capable model for complex tasks',
    contextLength: 32000,
    pricing: 'Pay per token',
    providerId: 'gemini',
  },
  
  // DeepSeek models
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'General purpose chat model',
    contextLength: 8192,
    pricing: 'Limited free tier available',
    providerId: 'deepseek',
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    description: 'Specialized for code generation and understanding',
    contextLength: 8192,
    pricing: 'Limited free tier available',
    providerId: 'deepseek',
  },
  
  // Grok models
  {
    id: 'grok-1',
    name: 'Grok-1',
    description: 'xAI\'s conversational AI with real-time knowledge',
    contextLength: 8192,
    pricing: 'Limited access through platform',
    providerId: 'grok',
  },
  
  // Hugging Face models
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.2',
    name: 'Mistral 7B Instruct',
    description: 'Efficient instruction-following model',
    contextLength: 8192,
    pricing: 'Free with API key',
    providerId: 'huggingface',
  },
  {
    id: 'meta-llama/Llama-2-7b-chat-hf',
    name: 'Llama 2 7B Chat',
    description: 'Meta\'s conversational model',
    contextLength: 4096,
    pricing: 'Free with API key',
    providerId: 'huggingface',
  },
  {
    id: 'tiiuae/falcon-7b-instruct',
    name: 'Falcon 7B Instruct',
    description: 'Instruction-tuned model from TII',
    contextLength: 2048,
    pricing: 'Free with API key',
    providerId: 'huggingface',
  },
  
  // OpenRouter models
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient model from OpenAI',
    contextLength: 16385,
    pricing: 'Pay per token, with free credits for new users',
    providerId: 'openrouter',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku (via OpenRouter)',
    description: 'Fast and efficient model from Anthropic',
    contextLength: 200000,
    pricing: 'Pay per token, with free credits for new users',
    providerId: 'openrouter',
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B Instruct (via OpenRouter)',
    description: 'Efficient open-source model',
    contextLength: 8192,
    pricing: 'Pay per token, with free credits for new users',
    providerId: 'openrouter',
  },
  
  // Anthropic models
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Most powerful Claude model for complex tasks',
    contextLength: 200000,
    pricing: 'Pay per token',
    providerId: 'anthropic',
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    description: 'Balanced performance and cost',
    contextLength: 200000,
    pricing: 'Pay per token',
    providerId: 'anthropic',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fast and efficient model',
    contextLength: 200000,
    pricing: 'Pay per token',
    providerId: 'anthropic',
  },
  
  // Mistral AI models
  {
    id: 'mistral-tiny-latest',
    name: 'Mistral Tiny',
    description: 'Fast and cost-effective model',
    contextLength: 32000,
    pricing: 'Pay per token, with free tier',
    providerId: 'mistral',
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    description: 'Balanced performance and cost',
    contextLength: 32000,
    pricing: 'Pay per token, with free tier',
    providerId: 'mistral',
  },
  {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium',
    description: 'Advanced reasoning capabilities',
    contextLength: 32000,
    pricing: 'Pay per token',
    providerId: 'mistral',
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    description: 'Most powerful Mistral model',
    contextLength: 32000,
    pricing: 'Pay per token',
    providerId: 'mistral',
  },
  
  // Perplexity models
  {
    id: 'pplx-7b-online',
    name: 'Perplexity 7B Online',
    description: '7B parameter model with online search capabilities',
    contextLength: 4096,
    pricing: 'Pay per token, with free tier',
    providerId: 'perplexity',
  },
  {
    id: 'pplx-70b-online',
    name: 'Perplexity 70B Online',
    description: '70B parameter model with online search capabilities',
    contextLength: 4096,
    pricing: 'Pay per token',
    providerId: 'perplexity',
  },
  {
    id: 'pplx-7b-chat',
    name: 'Perplexity 7B Chat',
    description: '7B parameter model optimized for chat',
    contextLength: 4096,
    pricing: 'Pay per token, with free tier',
    providerId: 'perplexity',
  },
  {
    id: 'pplx-70b-chat',
    name: 'Perplexity 70B Chat',
    description: '70B parameter model optimized for chat',
    contextLength: 4096,
    pricing: 'Pay per token',
    providerId: 'perplexity',
  },
  
  // Ollama models
  {
    id: 'llama2',
    name: 'Llama 2',
    description: 'Meta\'s general purpose model',
    contextLength: 4096,
    pricing: 'Free (self-hosted)',
    providerId: 'ollama',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Efficient open-source model',
    contextLength: 8192,
    pricing: 'Free (self-hosted)',
    providerId: 'ollama',
  },
  {
    id: 'codellama',
    name: 'CodeLlama',
    description: 'Specialized for code generation',
    contextLength: 4096,
    pricing: 'Free (self-hosted)',
    providerId: 'ollama',
  },
];

// Create the provider component
export const AIModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [providers, setProviders] = useState<ModelProvider[]>(defaultProviders);
  const [models, setModels] = useState<Model[]>(defaultModels);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-2.0');
  const [freeTierOnly, setFreeTierOnly] = useState<boolean>(true);
  const [usageStats, setUsageStats] = useState({
    totalTokens: 0,
    providers: Object.fromEntries(
      defaultProviders.map(p => [
        p.id,
        { totalTokens: 0, promptTokens: 0, completionTokens: 0, requests: 0 }
      ])
    )
  });

  // Effect to update selected model when provider changes
  useEffect(() => {
    const providerModels = models.filter(m => m.providerId === selectedProvider);
    if (providerModels.length > 0 && !providerModels.some(m => m.id === selectedModel)) {
      setSelectedModel(providerModels[0].id);
    }
  }, [selectedProvider, models, selectedModel]);

  // Get available models for a provider
  const getAvailableModels = (providerId?: string) => {
    const filteredModels = models.filter(m => 
      providerId ? m.providerId === providerId : true
    );
    
    if (freeTierOnly) {
      return filteredModels.filter(m => 
        m.pricing.toLowerCase().includes('free')
      );
    }
    
    return filteredModels;
  };

  // Get provider for a model
  const getProviderForModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return undefined;
    
    return providers.find(p => p.id === model.providerId);
  };

  // Check if currently using a free tier model
  const isUsingFreeTier = () => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model.pricing.toLowerCase().includes('free') : false;
  };

  // Toggle free tier only filter
  const toggleFreeTierOnly = () => {
    setFreeTierOnly(!freeTierOnly);
  };

  // Reset usage stats
  const resetUsageStats = () => {
    setUsageStats({
      totalTokens: 0,
      providers: Object.fromEntries(
        providers.map(p => [
          p.id,
          { totalTokens: 0, promptTokens: 0, completionTokens: 0, requests: 0 }
        ])
      )
    });
  };

  // Fetch providers and models from API
  useEffect(() => {
    const fetchProvidersAndModels = async () => {
      try {
        const response = await fetch('/api/ai/providers');
        if (response.ok) {
          const data = await response.json();
          if (data.providers) setProviders(data.providers);
          if (data.models) setModels(data.models);
        }
      } catch (error) {
        console.error('Failed to fetch AI providers and models:', error);
      }
    };

    fetchProvidersAndModels();
  }, []);

  return (
    <AIModelContext.Provider
      value={{
        providers,
        models,
        selectedProvider,
        selectedModel,
        setSelectedProvider,
        setSelectedModel,
        usageStats,
        resetUsageStats,
        isUsingFreeTier: isUsingFreeTier(),
        toggleFreeTierOnly,
        freeTierOnly,
        getAvailableModels,
        getProviderForModel,
      }}
    >
      {children}
    </AIModelContext.Provider>
  );
};

// Create a hook to use the context
export const useAIModel = () => {
  const context = useContext(AIModelContext);
  if (context === undefined) {
    throw new Error('useAIModel must be used within an AIModelProvider');
  }
  return context;
};
