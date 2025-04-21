import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../contexts/AuthContext';

interface TokenPackage {
  id: number;
  amount: number;
  price: number;
  discount: number;
}

const tokenPackages: TokenPackage[] = [
  { id: 1, amount: 100, price: 0.99, discount: 0 },
  { id: 2, amount: 500, price: 4.49, discount: 10 },
  { id: 3, amount: 1000, price: 8.49, discount: 15 },
  { id: 4, amount: 5000, price: 39.99, discount: 20 },
  { id: 5, amount: 10000, price: 69.99, discount: 30 },
];

const TokenPurchase: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        // In a real implementation, you would fetch the token balance from your API
        // For this example, we'll use a mock balance
        setBalance(250);
      } catch (err) {
        console.error('Failed to fetch token balance:', err);
      }
    };
    
    fetchBalance();
  }, [success]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !selectedPackage) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // In a real implementation, you would call your backend API to process the token purchase
      // For this example, we'll simulate a successful purchase
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update balance (in a real app, this would come from the API response)
      setBalance(prevBalance => prevBalance + selectedPackage.amount);
      
      // Set success state
      setSuccess(true);
      
      // Reset form after short delay
      setTimeout(() => {
        setSuccess(false);
        setSelectedPackage(null);
        if (cardElement) {
          cardElement.clear();
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to process token purchase');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 bg-indigo-600 sm:p-10 sm:pb-6">
          <h2 className="text-2xl leading-8 font-extrabold text-white sm:text-3xl">
            Purchase Tokens
          </h2>
          <p className="mt-2 text-base text-indigo-200">
            Tokens are used for advanced agent operations and special features
          </p>
          
          <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-800 text-white">
            Current Balance: {balance} tokens
          </div>
        </div>
        
        <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tokenPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg border p-4 flex flex-col ${
                    selectedPackage?.id === pkg.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{pkg.amount} Tokens</h3>
                    {pkg.discount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Save {pkg.discount}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">${pkg.price}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    ${(pkg.price / pkg.amount).toFixed(4)} per token
                  </div>
                  <button
                    type="button"
                    className={`mt-4 w-full py-2 px-3 border rounded-md shadow-sm text-sm font-medium ${
                      selectedPackage?.id === pkg.id
                        ? 'bg-indigo-600 text-white border-transparent'
                        : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {selectedPackage?.id === pkg.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
            
            {success ? (
              <div className="mt-8 p-4 bg-green-100 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Purchase successful!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your tokens have been added to your account.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedPackage ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {error && (
                  <div className="p-4 bg-red-100 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="card-element" className="block text-sm font-medium text-gray-700">
                    Card details
                  </label>
                  <div className="mt-1 p-3 border border-gray-300 rounded-md shadow-sm">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                          invalid: {
                            color: '#9e2146',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={!stripe || loading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : `Purchase ${selectedPackage.amount} Tokens for $${selectedPackage.price}`}
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    onClick={() => setSelectedPackage(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-8 text-center text-gray-500">
                Select a token package to continue
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
