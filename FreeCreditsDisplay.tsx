import React, { useState, useEffect } from 'react';
import { useAIModel } from '../../contexts/AIModelContext';

interface FreeCreditsDisplayProps {
  className?: string;
}

const FreeCreditsDisplay: React.FC<FreeCreditsDisplayProps> = ({ className }) => {
  const { providers } = useAIModel();
  
  const [freeCredits, setFreeCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch free credits information on component mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/ai/free-credits')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch free credits information');
        }
        return response.json();
      })
      .then(data => {
        setFreeCredits(data.free_credits || {});
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching free credits:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">Loading free credits information...</p>
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

  if (!freeCredits || Object.keys(freeCredits).length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">No free credits information available.</p>
      </div>
    );
  }

  // Filter to only show providers that have free credits available
  const availableProviders = Object.entries(freeCredits)
    .filter(([_, info]: [string, any]) => info.available)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Available Free Credits</h3>
      
      <div className="space-y-3">
        {availableProviders.map(([providerId, info]: [string, any]) => {
          // Find the provider display name
          const provider = providers.find(p => p.id === providerId);
          const displayName = provider ? provider.name : providerId.charAt(0).toUpperCase() + providerId.slice(1);
          
          return (
            <div key={providerId} className="bg-green-50 dark:bg-green-900 p-3 rounded-md">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">{displayName}</h4>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                <span className="font-semibold">Credits:</span> {info.credits}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                <span className="font-semibold">Reset Period:</span> {info.reset_period}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                <span className="font-semibold">Usage Limit:</span> {info.usage_limit}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Free Tier Best Practices</h4>
        <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-blue-700 dark:text-blue-300">
          <li>Use the Usage Optimizer to maximize free tier efficiency</li>
          <li>Rotate between different providers to avoid hitting rate limits</li>
          <li>For self-hosted models like Ollama, consider running locally for unlimited usage</li>
          <li>Check provider documentation for the latest free tier policies</li>
        </ul>
      </div>
    </div>
  );
};

export default FreeCreditsDisplay;
