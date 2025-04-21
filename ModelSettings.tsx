import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../contexts/AIModelContext';

interface ModelSettingsProps {
  className?: string;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ className }) => {
  const {
    providers,
    models,
    selectedProvider,
    selectedModel,
    usageStats,
    resetUsageStats,
    freeTierOnly,
    isUsingFreeTier
  } = useAIModel();

  const [selectedModelDetails, setSelectedModelDetails] = useState<any>(null);
  const [selectedProviderDetails, setSelectedProviderDetails] = useState<any>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Update selected model and provider details when selection changes
  useEffect(() => {
    const modelDetails = models.find(m => m.id === selectedModel);
    setSelectedModelDetails(modelDetails);

    const providerDetails = providers.find(p => p.id === selectedProvider);
    setSelectedProviderDetails(providerDetails);
  }, [selectedModel, selectedProvider, models, providers]);

  // Initialize API key inputs
  useEffect(() => {
    const initialApiKeys: Record<string, string> = {};
    providers.forEach(provider => {
      initialApiKeys[provider.id] = localStorage.getItem(`${provider.id}_api_key`) || '';
    });
    setApiKeyInputs(initialApiKeys);
  }, [providers]);

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeyInputs(prev => ({
      ...prev,
      [providerId]: value
    }));
  };

  const saveApiKey = (providerId: string) => {
    const apiKey = apiKeyInputs[providerId];
    if (apiKey) {
      localStorage.setItem(`${providerId}_api_key`, apiKey);
      
      // Send API key to backend
      fetch('/api/ai/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerId,
          apiKey: apiKey
        }),
      })
      .then(response => {
        if (response.ok) {
          alert(`API key for ${providerId} saved successfully!`);
        } else {
          alert(`Failed to save API key for ${providerId}`);
        }
      })
      .catch(error => {
        console.error('Error saving API key:', error);
        alert(`Error saving API key: ${error.message}`);
      });
    }
  };

  const toggleShowApiKeys = () => {
    setShowApiKeys(!showApiKeys);
  };

  const handleResetUsageStats = () => {
    if (window.confirm('Are you sure you want to reset usage statistics?')) {
      resetUsageStats();
      
      // Call backend to reset usage stats
      fetch('/api/ai/usage/reset', {
        method: 'POST',
      })
      .catch(error => {
        console.error('Error resetting usage stats:', error);
      });
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI Model Settings</h3>
      
      {selectedModelDetails && selectedProviderDetails && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Current Selection</h4>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Provider:</span> {selectedProviderDetails.name}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Model:</span> {selectedModelDetails.name}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Context Length:</span> {selectedModelDetails.contextLength.toLocaleString()} tokens
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Pricing:</span> {selectedModelDetails.pricing}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Free Tier:</span> {isUsingFreeTier ? 'Yes' : 'No'}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Streaming:</span> {selectedProviderDetails.supportsStreaming ? 'Supported' : 'Not supported'}
            </p>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Usage Statistics</h4>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Total Tokens Used:</span> {usageStats.totalTokens.toLocaleString()}
          </p>
          
          {selectedProvider && usageStats.providers[selectedProvider] && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Current Provider Usage:</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                Tokens: {usageStats.providers[selectedProvider].totalTokens.toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                Requests: {usageStats.providers[selectedProvider].requests.toLocaleString()}
              </p>
            </div>
          )}
          
          <button
            onClick={handleResetUsageStats}
            className="mt-2 px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Reset Usage Stats
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">API Keys</h4>
          <button
            onClick={toggleShowApiKeys}
            className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showApiKeys ? 'Hide API Keys' : 'Show API Keys'}
          </button>
        </div>
        
        {showApiKeys && (
          <div className="space-y-3">
            {providers.map(provider => (
              <div key={provider.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {provider.name}
                </p>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiKeyInputs[provider.id] || ''}
                    onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                    placeholder={`Enter ${provider.name} API Key`}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                  <button
                    onClick={() => saveApiKey(provider.id)}
                    className="px-2 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {provider.hasFreeTier ? 'Free tier available' : 'No free tier'}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          API keys are stored locally in your browser and sent securely to the server.
          {freeTierOnly && ' You are currently using free tier models only.'}
        </p>
      </div>
    </div>
  );
};

export default ModelSettings;
