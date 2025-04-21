import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../contexts/AIModelContext';

interface ModelSelectorProps {
  onModelChange?: (provider: string, model: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, className }) => {
  const {
    providers,
    models,
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    freeTierOnly,
    toggleFreeTierOnly,
    getAvailableModels
  } = useAIModel();

  const [availableModels, setAvailableModels] = useState(getAvailableModels(selectedProvider));

  // Update available models when provider or freeTierOnly changes
  useEffect(() => {
    setAvailableModels(getAvailableModels(selectedProvider));
  }, [selectedProvider, freeTierOnly, getAvailableModels]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setSelectedProvider(newProvider);
    
    // Select the first model from the new provider
    const providerModels = getAvailableModels(newProvider);
    if (providerModels.length > 0) {
      setSelectedModel(providerModels[0].id);
      if (onModelChange) {
        onModelChange(newProvider, providerModels[0].id);
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

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Model Selection</h3>
      
      <div className="mb-4">
        <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Provider
        </label>
        <select
          id="provider-select"
          value={selectedProvider}
          onChange={handleProviderChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {providers
            .filter(provider => !freeTierOnly || provider.hasFreeTier)
            .map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Model
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={handleModelChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {availableModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {availableModels.find(m => m.id === selectedModel)?.description || ''}
        </p>
      </div>
      
      <div className="flex items-center mb-4">
        <input
          id="free-tier-toggle"
          type="checkbox"
          checked={freeTierOnly}
          onChange={toggleFreeTierOnly}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="free-tier-toggle" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Show only free tier models
        </label>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        <p>Context length: {availableModels.find(m => m.id === selectedModel)?.contextLength.toLocaleString() || 'Unknown'} tokens</p>
        <p>Pricing: {availableModels.find(m => m.id === selectedModel)?.pricing || 'Unknown'}</p>
      </div>
    </div>
  );
};

export default ModelSelector;
