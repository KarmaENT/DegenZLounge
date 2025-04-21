import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/solid';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearlyPrice: number;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeature[];
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 1,
    name: 'Free',
    description: 'Basic access to DeGeNz Lounge features',
    price: 0,
    yearlyPrice: 0,
    billingCycle: 'monthly',
    features: [
      { name: 'Create up to 3 custom agents', included: true },
      { name: '1 active sandbox session', included: true },
      { name: 'Basic agent templates', included: true },
      { name: 'Standard response speed', included: true },
      { name: '7-day message history', included: true },
      { name: 'Community support', included: true },
      { name: 'Export conversations', included: false },
      { name: 'Advanced agent tools', included: false },
      { name: 'Team workspace', included: false },
    ]
  },
  {
    id: 2,
    name: 'Pro',
    description: 'Enhanced access with more agents and sandboxes',
    price: 14.99,
    yearlyPrice: 149.99,
    billingCycle: 'monthly',
    highlighted: true,
    features: [
      { name: 'Create up to 10 custom agents', included: true },
      { name: '5 concurrent sandbox sessions', included: true },
      { name: 'Premium agent templates', included: true },
      { name: 'Priority response speed', included: true },
      { name: '30-day message history', included: true },
      { name: 'Email support', included: true },
      { name: 'Export conversations', included: true },
      { name: 'Advanced agent tools', included: true },
      { name: 'Team workspace', included: false },
    ]
  },
  {
    id: 3,
    name: 'Team',
    description: 'Collaborative features for team productivity',
    price: 39.99,
    yearlyPrice: 399.99,
    billingCycle: 'monthly',
    features: [
      { name: 'Up to 5 team members', included: true },
      { name: 'Create up to 25 custom agents', included: true },
      { name: '15 concurrent sandbox sessions', included: true },
      { name: 'Premium agent templates', included: true },
      { name: 'Priority response speed', included: true },
      { name: '90-day message history', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Export conversations', included: true },
      { name: 'Advanced agent tools', included: true },
      { name: 'Team workspace and sharing', included: true },
    ]
  }
];

const SubscriptionPlans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      setCurrentPlan(user.subscription_tier);
    }
  }, [user]);
  
  const getAdjustedPrice = (plan: PricingPlan) => {
    if (billingCycle === 'yearly') {
      return plan.yearlyPrice;
    }
    return plan.price;
  };
  
  const handleSelectPlan = (planId: number) => {
    // Navigate to checkout page
    window.location.href = `/subscribe/${planId}?cycle=${billingCycle}`;
  };
  
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose the Perfect Plan for Your Needs
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Unlock the full potential of AI agents with our flexible pricing options
          </p>
        </div>
        
        <div className="mt-12 flex justify-center">
          <div className="relative bg-white rounded-lg p-0.5 flex">
            <button
              type="button"
              className={`relative py-2 px-6 border border-transparent rounded-md ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`relative py-2 px-6 border border-transparent rounded-md ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly <span className="text-xs font-semibold">Save 17%</span>
            </button>
          </div>
        </div>
        
        <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${
                plan.highlighted
                  ? 'border-indigo-600 ring-2 ring-indigo-600'
                  : 'border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
                  <div className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600">
                    Most Popular
                  </div>
                </div>
              )}
              
              {currentPlan === plan.name.toLowerCase() && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                    <CheckIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-500">{plan.description}</p>
              </div>
              
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">
                  ${getAdjustedPrice(plan)}
                </span>
                <span className="ml-1 text-xl font-semibold">
                  {plan.price === 0 ? '' : `/${billingCycle === 'monthly' ? 'mo' : 'year'}`}
                </span>
              </div>
              
              <ul className="mt-6 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-start">
                    <div className="flex-shrink-0">
                      {feature.included ? (
                        <CheckIcon className="h-6 w-6 text-green-500" />
                      ) : (
                        <div className="h-6 w-6 text-gray-300">✕</div>
                      )}
                    </div>
                    <p className="ml-3 text-base text-gray-500">{feature.name}</p>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                {currentPlan === plan.name.toLowerCase() ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-md shadow bg-gray-100 text-gray-500 border border-gray-300"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`w-full py-3 px-4 rounded-md shadow ${
                      plan.highlighted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50'
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900">Enterprise Plan</h3>
          <p className="mt-4 text-lg text-gray-600">
            Need a custom solution for your organization?
          </p>
          <div className="mt-6">
            <Link
              to="/contact-sales"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
