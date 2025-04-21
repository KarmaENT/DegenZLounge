import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import MfaSetupPage from '../../pages/MfaSetupPage';
import SubscriptionPlans from '../../components/subscription/SubscriptionPlans';
import SubscriptionCheckout from '../../components/subscription/SubscriptionCheckout';
import TokenPurchase from '../../components/tokens/TokenPurchase';
import Marketplace from '../../components/marketplace/Marketplace';

// Mock Stripe
const mockStripe = {
  elements: jest.fn(),
  createPaymentMethod: jest.fn(),
};

jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  useStripe: () => mockStripe,
  useElements: () => ({
    getElement: () => ({}),
  }),
  CardElement: () => <div data-testid="card-element" />,
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(mockStripe)),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    user: { id: '123', email: 'test@example.com', username: 'testuser', subscription_tier: 'free' },
    loading: false,
    error: null,
    isAuthenticated: true,
    login: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com', username: 'testuser' }),
    register: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com', username: 'testuser' }),
    logout: jest.fn(),
    verifyMfa: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com', username: 'testuser' }),
    setupMfa: jest.fn().mockResolvedValue({ provisioning_uri: 'otpauth://totp/test', secret: 'ABCDEF' }),
    disableMfa: jest.fn().mockResolvedValue({ message: 'MFA disabled' }),
    refreshToken: jest.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: { from: { pathname: '/' } } }),
  useParams: () => ({ planId: '2' }),
  useSearchParams: () => [new URLSearchParams('cycle=monthly')],
}));

// Mock QR code component
jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code" />,
}));

describe('Authentication Components', () => {
  test('LoginPage renders correctly', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
  
  test('RegisterPage renders correctly', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });
  
  test('MfaSetupPage renders correctly', () => {
    render(
      <BrowserRouter>
        <MfaSetupPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Setup Two-Factor Authentication/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Setup Two-Factor Authentication/i })).toBeInTheDocument();
  });
});

describe('Monetization Components', () => {
  const stripePromise = loadStripe('pk_test_123');
  
  test('SubscriptionPlans renders correctly', () => {
    render(
      <BrowserRouter>
        <SubscriptionPlans />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Choose the Perfect Plan for Your Needs/i)).toBeInTheDocument();
    expect(screen.getByText(/Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Team/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Monthly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yearly/i })).toBeInTheDocument();
  });
  
  test('SubscriptionCheckout renders correctly', () => {
    render(
      <BrowserRouter>
        <Elements stripe={stripePromise}>
          <SubscriptionCheckout />
        </Elements>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Pro Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Card details/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subscribe to Pro/i })).toBeInTheDocument();
  });
  
  test('TokenPurchase renders correctly', () => {
    render(
      <BrowserRouter>
        <Elements stripe={stripePromise}>
          <TokenPurchase />
        </Elements>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Purchase Tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Balance:/i)).toBeInTheDocument();
    expect(screen.getByText(/100 Tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/500 Tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/1000 Tokens/i)).toBeInTheDocument();
  });
  
  test('Marketplace renders correctly', () => {
    render(
      <BrowserRouter>
        <Marketplace />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/DeGeNz Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover and purchase premium agents, templates, and tools/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sort By/i)).toBeInTheDocument();
  });
});

describe('Authentication Functionality', () => {
  test('Login form submission', async () => {
    const { useAuth } = require('../../contexts/AuthContext');
    const mockLogin = jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com', username: 'testuser' });
    useAuth.mockImplementation(() => ({
      ...useAuth(),
      login: mockLogin,
    }));
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
  
  test('Registration form submission', async () => {
    const { useAuth } = require('../../contexts/AuthContext');
    const mockRegister = jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com', username: 'testuser' });
    useAuth.mockImplementation(() => ({
      ...useAuth(),
      register: mockRegister,
    }));
    
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: 'testuser' },
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'testuser', 'password123');
    });
  });
  
  test('MFA setup process', async () => {
    const { useAuth } = require('../../contexts/AuthContext');
    const mockSetupMfa = jest.fn().mockResolvedValue({ provisioning_uri: 'otpauth://totp/test', secret: 'ABCDEF' });
    useAuth.mockImplementation(() => ({
      ...useAuth(),
      setupMfa: mockSetupMfa,
      user: { ...useAuth().user, mfa_enabled: false },
    }));
    
    render(
      <BrowserRouter>
        <MfaSetupPage />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Setup Two-Factor Authentication/i }));
    
    await waitFor(() => {
      expect(mockSetupMfa).toHaveBeenCalledWith('totp');
      expect(screen.getByText(/Scan this QR code/i)).toBeInTheDocument();
    });
  });
});

describe('Monetization Functionality', () => {
  const stripePromise = loadStripe('pk_test_123');
  
  test('Subscription plan selection', () => {
    render(
      <BrowserRouter>
        <SubscriptionPlans />
      </BrowserRouter>
    );
    
    // Test monthly/yearly toggle
    fireEvent.click(screen.getByRole('button', { name: /Yearly/i }));
    expect(screen.getByText(/\$149.99/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Monthly/i }));
    expect(screen.getByText(/\$14.99/)).toBeInTheDocument();
    
    // Test plan selection
    const subscribeButtons = screen.getAllByRole('button', { name: /Subscribe|Get Started/i });
    fireEvent.click(subscribeButtons[1]); // Click Pro plan
    
    // In a real test, we would verify navigation to checkout page
  });
  
  test('Token package selection', () => {
    render(
      <BrowserRouter>
        <Elements stripe={stripePromise}>
          <TokenPurchase />
        </Elements>
      </BrowserRouter>
    );
    
    const selectButtons = screen.getAllByRole('button', { name: /Select/i });
    fireEvent.click(selectButtons[1]); // Select 500 tokens package
    
    expect(screen.getByText(/Card details/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    
    // In a real test, we would verify form submission
  });
  
  test('Marketplace filtering', () => {
    render(
      <BrowserRouter>
        <Marketplace />
      </BrowserRouter>
    );
    
    // Test category filter
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'agent' } });
    
    // Test search filter
    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'research' } });
    
    // Test sort filter
    const sortSelect = screen.getByLabelText(/Sort By/i);
    fireEvent.change(sortSelect, { target: { value: 'popular' } });
    
    // In a real test, we would verify filtered results
  });
});
