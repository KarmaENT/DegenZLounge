import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../contexts/AuthContext';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearlyPrice: number;
  features: string[];
}

const plans: Record<number, Plan> = {
  1: {
    id: 1,
    name: 'Free',
    description: 'Basic access to DeGeNz Lounge features',
    price: 0,
    yearlyPrice: 0,
    features: [
      'Create up to 3 custom agents',
      '1 active sandbox session',
      'Basic agent templates',
      'Standard response speed',
      '7-day message history',
      'Community support'
    ]
  },
  2: {
    id: 2,
    name: 'Pro',
    description: 'Enhanced access with more agents and sandboxes',
    price: 14.99,
    yearlyPrice: 149.99,
    features: [
      'Create up to 10 custom agents',
      '5 concurrent sandbox sessions',
      'Premium agent templates',
      'Priority response speed',
      '30-day message history',
      'Email support',
      'Export conversations',
      'Advanced agent tools'
    ]
  },
  3: {
    id: 3,
    name: 'Team',
    description: 'Collaborative features for team productivity',
    price: 39.99,
    yearlyPrice: 399.99,
    features: [
      'Up to 5 team members',
      'Create up to 25 custom agents',
      '15 concurrent sandbox sessions',
      'Premium agent templates',
      'Priority response speed',
      '90-day message history',
      'Priority email support',
      'Export conversations',
      'Advanced agent tools',
      'Team workspace and sharing'
    ]
  }
};

const SubscriptionCheckout: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const billingCycle = searchParams.get('cycle') || 'monthly';
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (planId && plans[Number(planId)]) {
      setPlan(plans[Number(planId)]);
    } else {
      setError('Invalid plan selected');
    }
  }, [planId]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !plan) {
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
      
      // In a real implementation, you would call your backend API to process the subscription
      // For this example, we'll simulate a successful subscription
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set success state
      setSuccess(true);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to process subscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!plan) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 bg-indigo-600 sm:p-10 sm:pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl leading-8 font-extrabold text-white sm:text-3xl">
              {plan.name} Plan
            </h2>
            <div className="text-white text-right">
              <span className="text-4xl font-extrabold">
                ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
              </span>
              <span className="text-xl font-medium ml-1">
                /{billingCycle === 'monthly' ? 'mo' : 'year'}
              </span>
            </div>
          </div>
          <p className="mt-2 text-base text-indigo-200">{plan.description}</p>
        </div>
        
        <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
          <ul className="space-y-4">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-base text-gray-700">{feature}</p>
              </li>
            ))}
          </ul>
          
          {success ? (
            <div className="mt-8 p-4 bg-green-100 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Subscription successful!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Thank you for subscribing to the {plan.name} plan. Redirecting to dashboard...</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
              
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the <a href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                </label>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={!stripe || loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
                </button>
              </div>
              
              <div className="text-sm text-gray-500 text-center">
                You can cancel or change your subscription at any time.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
