import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../contexts/AIModelContext';

interface UsageOptimizerProps {
  className?: string;
  onOptimizationApplied?: (optimizedPrompt: string, recommendedModel: any) => void;
}

const UsageOptimizer: React.FC<UsageOptimizerProps> = ({ className, onOptimizationApplied }) => {
  const { setSelectedProvider, setSelectedModel } = useAIModel();
  
  const [prompt, setPrompt] = useState('');
  const [optimizations, setOptimizations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [loadingCache, setLoadingCache] = useState(false);

  // Fetch cache status on component mount
  useEffect(() => {
    fetchCacheStatus();
  }, []);

  const fetchCacheStatus = () => {
    setLoadingCache(true);
    fetch('/api/ai/cache-status')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch cache status');
        }
        return response.json();
      })
      .then(data => {
        setCacheStatus(data.cache);
        setLoadingCache(false);
      })
      .catch(err => {
        console.error('Error fetching cache status:', err);
        setLoadingCache(false);
      });
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the response cache?')) {
      fetch('/api/ai/cache', {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to clear cache');
          }
          return response.json();
        })
        .then(() => {
          alert('Cache cleared successfully');
          fetchCacheStatus();
        })
        .catch(err => {
          console.error('Error clearing cache:', err);
          alert(`Error clearing cache: ${err.message}`);
        });
    }
  };

  const handleOptimize = () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to optimize');
      return;
    }

    setLoading(true);
    setError(null);
    
    fetch('/api/ai/optimize-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to optimize prompt');
        }
        return response.json();
      })
      .then(data => {
        setOptimizations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error optimizing prompt:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  const applyOptimization = (type: string) => {
    let optimizedPrompt = prompt;
    
    switch (type) {
      case 'shorten':
        // This is a simplified example - in a real app, you might use an AI to actually shorten the prompt
        optimizedPrompt = prompt.split('.').slice(0, Math.ceil(prompt.split('.').length * 0.7)).join('.');
        break;
      case 'remove_politeness':
        optimizedPrompt = prompt
          .replace(/please/gi, '')
          .replace(/could you/gi, '')
          .replace(/would you/gi, '')
          .replace(/thank you/gi, '')
          .replace(/  +/g, ' ')
          .trim();
        break;
      default:
        break;
    }
    
    setPrompt(optimizedPrompt);
    
    if (optimizations?.recommended_model && onOptimizationApplied) {
      // Apply recommended model
      setSelectedProvider(optimizations.recommended_model.provider);
      setSelectedModel(optimizations.recommended_model.model);
      
      onOptimizationApplied(optimizedPrompt, optimizations.recommended_model);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Free Tier Usage Optimizer</h3>
      
      <div className="mb-4">
        <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Enter your prompt to optimize
        </label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      
      <div className="mb-4">
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-400"
        >
          {loading ? 'Optimizing...' : 'Optimize for Free Tier'}
        </button>
        
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
      
      {optimizations && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Optimization Results</h4>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Original Token Count:</span> ~{optimizations.original_tokens}
            </p>
            
            {optimizations.recommended_model && (
              <div className="mt-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                  Recommended Model:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                  {optimizations.recommended_model.provider.charAt(0).toUpperCase() + optimizations.recommended_model.provider.slice(1)} - {optimizations.recommended_model.model}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                  Reason: {optimizations.recommended_model.reason}
                </p>
                <button
                  onClick={() => {
                    setSelectedProvider(optimizations.recommended_model.provider);
                    setSelectedModel(optimizations.recommended_model.model);
                    alert(`Model switched to ${optimizations.recommended_model.model}`);
                  }}
                  className="mt-1 px-2 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Switch to Recommended Model
                </button>
              </div>
            )}
          </div>
          
          {optimizations.suggestions && optimizations.suggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Optimization Suggestions:
              </p>
              
              <div className="space-y-2">
                {optimizations.suggestions.map((suggestion: any, index: number) => (
                  <div key={index} className="bg-blue-50 dark:bg-blue-900 p-2 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {suggestion.description}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Potential savings: {suggestion.potential_savings}
                    </p>
                    <button
                      onClick={() => applyOptimization(suggestion.type)}
                      className="mt-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Apply This Optimization
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Response Cache</h4>
        
        {loadingCache ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading cache status...</p>
        ) : cacheStatus ? (
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Status:</span> {cacheStatus.enabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Cache Size:</span> {cacheStatus.size} entries
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Hit Rate:</span> {cacheStatus.hit_rate}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Tokens Saved:</span> {cacheStatus.savings.tokens.toLocaleString()}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Requests Saved:</span> {cacheStatus.savings.requests.toLocaleString()}
            </p>
            
            <button
              onClick={handleClearCache}
              className="mt-2 px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Clear Cache
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">Cache information not available</p>
        )}
        
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Caching identical requests saves API usage and improves response times.
        </p>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-medium">Free Tier Usage Tips:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>Keep prompts concise and specific</li>
          <li>Use shorter context windows when possible</li>
          <li>Split complex tasks into smaller requests</li>
          <li>Leverage response caching for repeated queries</li>
          <li>Choose models based on task requirements</li>
        </ul>
      </div>
    </div>
  );
};

export default UsageOptimizer;
