import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

// Define the API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  mfa_enabled: boolean;
  subscription_tier: string;
  subscription_status: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
  message: string;
}

export interface MfaRequiredResponse {
  id: string;
  mfa_required: boolean;
  mfa_method: string;
}

export interface MfaSetupResponse {
  provisioning_uri: string;
  secret: string;
}

// Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse | MfaRequiredResponse>;
  register: (email: string, username: string, password: string) => Promise<any>;
  logout: () => void;
  verifyMfa: (userId: string, code: string) => Promise<LoginResponse>;
  setupMfa: (method: string) => Promise<MfaSetupResponse>;
  disableMfa: () => Promise<any>;
  refreshToken: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokens = getTokens();
        if (tokens) {
          // Verify token by getting current user
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Store tokens in localStorage
  const storeTokens = (tokens: AuthTokens): void => {
    localStorage.setItem('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  };

  // Get tokens from localStorage
  const getTokens = (): AuthTokens | null => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    
    if (!access_token) return null;
    
    return {
      access_token,
      refresh_token: refresh_token || undefined
    };
  };

  // Clear tokens from localStorage
  const clearTokens = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // Register a new user
  const register = async (email: string, username: string, password: string): Promise<any> => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        username,
        password
      });
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<LoginResponse | MfaRequiredResponse> => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      // Check if MFA is required
      if (response.data.mfa_required) {
        return response.data as MfaRequiredResponse;
      }
      
      // Store tokens
      storeTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      });
      
      // Get user data
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      return response.data as LoginResponse;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Verify MFA code
  const verifyMfa = async (userId: string, code: string): Promise<LoginResponse> => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/mfa/verify`, {
        user_id: userId,
        code
      });
      
      // Store tokens
      storeTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      });
      
      // Get user data
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'MFA verification failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Setup MFA
  const setupMfa = async (method: string): Promise<MfaSetupResponse> => {
    setError(null);
    try {
      const tokens = getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      const response = await axios.post(
        `${API_URL}/auth/mfa/setup`,
        { method },
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        }
      );
      
      // Update user data
      const userData = await getCurrentUser();
      setUser(userData);
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'MFA setup failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Disable MFA
  const disableMfa = async (): Promise<any> => {
    setError(null);
    try {
      const tokens = getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      const response = await axios.post(
        `${API_URL}/auth/mfa/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        }
      );
      
      // Update user data
      const userData = await getCurrentUser();
      setUser(userData);
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to disable MFA';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Get current user
  const getCurrentUser = async (): Promise<User> => {
    try {
      const tokens = getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      });
      
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Try to refresh token
        try {
          await refreshToken();
          // Retry getting user
          const tokens = getTokens();
          if (!tokens) throw new Error('Not authenticated');
          
          const response = await axios.get(`${API_URL}/auth/user`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`
            }
          });
          
          return response.data;
        } catch (refreshError) {
          // If refresh fails, logout
          logout();
          throw new Error('Session expired');
        }
      }
      throw err;
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<void> => {
    try {
      const tokens = getTokens();
      if (!tokens || !tokens.refresh_token) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: tokens.refresh_token
      });
      
      // Update access token
      storeTokens({
        access_token: response.data.access_token,
        refresh_token: tokens.refresh_token
      });
    } catch (err) {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    }
  };

  // Logout
  const logout = (): void => {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Create axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If error is 401 and not a refresh token request and not already retrying
        if (
          error.response?.status === 401 &&
          !originalRequest.url.includes('/auth/refresh') &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          
          try {
            await refreshToken();
            const tokens = getTokens();
            if (tokens) {
              originalRequest.headers['Authorization'] = `Bearer ${tokens.access_token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, logout and redirect to login
            logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    verifyMfa,
    setupMfa,
    disableMfa,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
): React.FC<P> => {
  const WithAuth: React.FC<P> = (props) => {
    const { user, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate('/login', { state: { from: location }, replace: true });
      }
      
      if (!loading && isAuthenticated && requiredRole && user && !user.roles.includes(requiredRole)) {
        navigate('/unauthorized', { replace: true });
      }
    }, [loading, isAuthenticated, user, navigate, location]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full loader border-t-indigo-500 animate-spin"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && user && !user.roles.includes(requiredRole)) {
      return null;
    }

    return <Component {...props} />;
  };

  return WithAuth;
};

// Import for withAuth HOC
import { useNavigate, useLocation } from 'react-router-dom';
