import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIModelProvider } from '../../contexts/AIModelContext';
import ModelSelector from '../../components/ai/ModelSelector';
import ModelSettings from '../../components/ai/ModelSettings';
import FreeModelSelector from '../../components/ai/FreeModelSelector';
import UsageOptimizer from '../../components/ai/UsageOptimizer';
import FreeCreditsDisplay from '../../components/ai/FreeCreditsDisplay';

// Mock fetch
global.fetch = jest.fn();

// Helper to mock fetch responses
const mockFetchResponse = (data: any) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

describe('AI Model Components', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  test('ModelSelector renders correctly', async () => {
    // Mock fetch for providers
    (global.fetch as jest.Mock).mockImplementation(() => 
      mockFetchResponse({
        providers: [
          {
            id: 'gemini',
            name: 'Gemini',
            description: 'Google\'s multimodal AI models',
            hasFreeTier: true,
            supportsStreaming: true,
          },
          {
            id: 'mistral',
            name: 'Mistral AI',
            description: 'Efficient models with strong reasoning',
            hasFreeTier: true,
            supportsStreaming: true,
          }
        ],
        models: [
          {
            id: 'gemini-flash-2.0',
            name: 'Gemini Flash 2.0',
            description: 'Fast and efficient model for general tasks',
            contextLength: 32000,
            pricing: 'Free tier available',
            providerId: 'gemini',
          },
          {
            id: 'mistral-small-latest',
            name: 'Mistral Small',
            description: 'Balanced performance and cost',
            contextLength: 32000,
            pricing: 'Pay per token, with free tier',
            providerId: 'mistral',
          }
        ]
      })
    );

    render(
      <AIModelProvider>
        <ModelSelector />
      </AIModelProvider>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('AI Model Selection')).toBeInTheDocument();
    });

    // Check provider dropdown
    const providerSelect = screen.getByLabelText('Provider');
    expect(providerSelect).toBeInTheDocument();
    
    // Check model dropdown
    const modelSelect = screen.getByLabelText('Model');
    expect(modelSelect).toBeInTheDocument();
    
    // Check free tier toggle
    const freeToggle = screen.getByLabelText('Show only free tier models');
    expect(freeToggle).toBeInTheDocument();
    
    // Test changing provider
    fireEvent.change(providerSelect, { target: { value: 'mistral' } });
    
    // Test changing model
    fireEvent.change(modelSelect, { target: { value: 'mistral-small-latest' } });
    
    // Test toggling free tier
    fireEvent.click(freeToggle);
  });

  test('ModelSettings renders correctly', async () => {
    // Mock fetch for providers
    (global.fetch as jest.Mock).mockImplementation(() => 
      mockFetchResponse({
        providers: [
          {
            id: 'gemini',
            name: 'Gemini',
            description: 'Google\'s multimodal AI models',
            hasFreeTier: true,
            supportsStreaming: true,
          }
        ],
        models: [
          {
            id: 'gemini-flash-2.0',
            name: 'Gemini Flash 2.0',
            description: 'Fast and efficient model for general tasks',
            contextLength: 32000,
            pricing: 'Free tier available',
            providerId: 'gemini',
          }
        ]
      })
    );

    render(
      <AIModelProvider>
        <ModelSettings />
      </AIModelProvider>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('AI Model Settings')).toBeInTheDocument();
    });

    // Check current selection section
    await waitFor(() => {
      expect(screen.getByText('Current Selection')).toBeInTheDocument();
    });
    
    // Check usage statistics section
    expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    
    // Check API keys section
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    
    // Test showing API keys
    fireEvent.click(screen.getByText('Show API Keys'));
    
    // Test reset usage stats
    fireEvent.click(screen.getByText('Reset Usage Stats'));
  });

  test('FreeModelSelector renders correctly', async () => {
    // Mock fetch for free providers
    (global.fetch as jest.Mock).mockImplementation(() => 
      mockFetchResponse({
        providers: [
          {
            id: 'gemini',
            name: 'Gemini',
            description: 'Google\'s multimodal AI models',
            hasFreeTier: true,
            supportsStreaming: true,
          },
          {
            id: 'huggingface',
            name: 'Hugging Face',
            description: 'Open-source models with various specializations',
            hasFreeTier: true,
            supportsStreaming: false,
          }
        ]
      })
    );

    render(
      <AIModelProvider>
        <FreeModelSelector />
      </AIModelProvider>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Free AI Models')).toBeInTheDocument();
    });

    // Check provider dropdown
    const providerSelect = screen.getByLabelText('Free Provider');
    expect(providerSelect).toBeInTheDocument();
    
    // Check model dropdown
    const modelSelect = screen.getByLabelText('Free Model');
    expect(modelSelect).toBeInTheDocument();
    
    // Check free tier info
    expect(screen.getByText('Free Tier:')).toBeInTheDocument();
    
    // Test changing provider
    fireEvent.change(providerSelect, { target: { value: 'huggingface' } });
  });

  test('UsageOptimizer renders correctly', async () => {
    // Mock fetch for cache status
    (global.fetch as jest.Mock).mockImplementation(() => 
      mockFetchResponse({
        cache: {
          enabled: true,
          size: 250,
          hit_rate: '68%',
          savings: {
            tokens: 45000,
            requests: 250
          }
        }
      })
    );

    render(
      <AIModelProvider>
        <UsageOptimizer />
      </AIModelProvider>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Free Tier Usage Optimizer')).toBeInTheDocument();
    });

    // Check prompt textarea
    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    expect(promptInput).toBeInTheDocument();
    
    // Check optimize button
    const optimizeButton = screen.getByText('Optimize for Free Tier');
    expect(optimizeButton).toBeInTheDocument();
    
    // Check cache section
    expect(screen.getByText('Response Cache')).toBeInTheDocument();
    
    // Check usage tips
    expect(screen.getByText('Free Tier Usage Tips:')).toBeInTheDocument();
    
    // Test entering prompt and optimizing
    fireEvent.change(promptInput, { target: { value: 'Please could you help me with a complex task that requires a lot of tokens and processing power?' } });
    
    // Mock optimize response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      mockFetchResponse({
        original_tokens: 18,
        suggestions: [
          {
            type: 'remove_politeness',
            description: 'Remove unnecessary politeness phrases',
            potential_savings: '5-10 tokens'
          }
        ],
        recommended_model: {
          provider: 'gemini',
          model: 'gemini-flash-2.0',
          reason: 'Fast and efficient for general tasks'
        }
      })
    );
    
    fireEvent.click(optimizeButton);
    
    // Wait for optimization results
    await waitFor(() => {
      expect(screen.getByText('Optimization Results')).toBeInTheDocument();
    });
    
    // Test applying optimization
    await waitFor(() => {
      const applyButton = screen.getByText('Apply This Optimization');
      fireEvent.click(applyButton);
    });
    
    // Test switching to recommended model
    await waitFor(() => {
      const switchButton = screen.getByText('Switch to Recommended Model');
      fireEvent.click(switchButton);
    });
    
    // Test clearing cache
    const clearCacheButton = screen.getByText('Clear Cache');
    
    // Mock clear cache response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      mockFetchResponse({
        message: 'Cache cleared successfully'
      })
    );
    
    fireEvent.click(clearCacheButton);
  });

  test('FreeCreditsDisplay renders correctly', async () => {
    // Mock fetch for free credits
    (global.fetch as jest.Mock).mockImplementation(() => 
      mockFetchResponse({
        free_credits: {
          gemini: {
            available: true,
            credits: 'Unlimited for basic usage',
            reset_period: 'N/A',
            usage_limit: '60 requests per minute'
          },
          huggingface: {
            available: true,
            credits: 'Unlimited for open models',
            reset_period: 'N/A',
            usage_limit: '30,000 requests per day'
          }
        }
      })
    );

    render(
      <AIModelProvider>
        <FreeCreditsDisplay />
      </AIModelProvider>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Available Free Credits')).toBeInTheDocument();
    });

    // Check provider credits
    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.getByText('Hugging Face')).toBeInTheDocument();
    
    // Check credits details
    expect(screen.getByText('Credits:')).toBeInTheDocument();
    expect(screen.getByText('Reset Period:')).toBeInTheDocument();
    expect(screen.getByText('Usage Limit:')).toBeInTheDocument();
    
    // Check best practices
    expect(screen.getByText('Free Tier Best Practices')).toBeInTheDocument();
  });
});
