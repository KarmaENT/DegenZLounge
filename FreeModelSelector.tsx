import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../contexts/AIModelContext';

interface FreeModelSelectorProps {
  onModelChange?: (provider: string, model: string) => void;
  className?: string;
}

const FreeModelSelector: React.FC<FreeModelSelectorProps> = ({ onModelChange, className }) => {
  const {
    providers,
    models,
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    getAvailableModels
  } = useAIModel();

  const [freeProviders, setFreeProviders] = useState<any[]>([]);
  const [freeModels, setFreeModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch free providers from the backend
  useEffect(() => {
    setLoading(true);
    fetch('/api/ai/free-providers')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch free providers');
        }
        return response.json();
      })
      .then(data => {
        setFreeProviders(data.providers || []);
        
        // If we have free providers, select the first one
        if (data.providers && data.providers.length > 0) {
          const firstProvider = data.providers[0].id;
          
          // Get free models for this provider
          const providerFreeModels = models.filter(
            m => m.providerId === firstProvider && m.pricing.toLowerCase().includes('free')
          );
          
          setFreeModels(providerFreeModels);
          
          // Select the first free model if available
          if (providerFreeModels.length > 0) {
            setSelectedProvider(firstProvider);
            setSelectedModel(providerFreeModels[0].id);
            if (onModelChange) {
              onModelChange(firstProvider, providerFreeModels[0].id);
            }
          }
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching free providers:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [models, setSelectedProvider, setSelectedModel, onModelChange]);

  // Update free models when selected provider changes
  useEffect(() => {
    if (selectedProvider) {
      const providerFreeModels = models.filter(
        m => m.providerId === selectedProvider && m.pricing.toLowerCase().includes('free')
      );
      setFreeModels(providerFreeModels);
    }
  }, [selectedProvider, models]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setSelectedProvider(newProvider);
    
    // Get free models for this provider
    const providerFreeModels = models.filter(
      m => m.providerId === newProvider && m.pricing.toLowerCase().includes('free')
    );
    
    // Select the first model from the new provider
    if (providerFreeModels.length > 0) {
      setSelectedModel(providerFreeModels[0].id);
      if (onModelChange) {
        onModelChange(newProvider, providerFreeModels[0].id);
      }
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    if (onModelChange) {
      onModelChange(selectedProvider, newModel);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">Loading free models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (freeProviders.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">No free AI providers available. Please add API keys in settings.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Free AI Models</h3>
      
      <div className="mb-4">
        <label htmlFor="free-provider-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Free Provider
        </label>
        <select
          id="free-provider-select"
          value={selectedProvider}
          onChange={handleProviderChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {freeProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="free-model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Free Model
        </label>
        <select
          id="free-model-select"
          value={selectedModel}
          onChange={handleModelChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {freeModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {freeModels.find(m => m.id === selectedModel)?.description || ''}
        </p>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900 p-3 rounded-md mt-4">
        <p className="text-sm text-green-800 dark:text-green-200">
          <span className="font-semibold">Free Tier:</span> These models can be used without any cost.
        </p>
        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
          Usage may be subject to rate limits and fair use policies.
        </p>
      </div>
    </div>
  );
};

export default FreeModelSelector;
