import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, login as apiLogin, signup as apiSignup, verifyToken } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenVerificationAttempted: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for storing token in localStorage
const TOKEN_KEY = 'auth_token';
// Token verification timestamp to avoid too frequent verification
const TOKEN_VERIFICATION_KEY = 'token_last_verified';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenVerificationAttempted, setTokenVerificationAttempted] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        
        if (storedToken) {
          // Check if we need to verify the token
          const lastVerified = localStorage.getItem(TOKEN_VERIFICATION_KEY);
          const now = Date.now();
          const verificationNeeded = !lastVerified || (now - parseInt(lastVerified)) > 15 * 60 * 1000; // 15 minutes
          
          setToken(storedToken);
          
          if (verificationNeeded) {
            console.log('Verifying token...');
            const userData = await verifyToken(storedToken);
            
            if (userData) {
              setUser(userData);
              // Update last verification time
              localStorage.setItem(TOKEN_VERIFICATION_KEY, now.toString());
            } else {
              // Token verification failed, clear storage
              console.warn('Token verification failed, clearing auth data');
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(TOKEN_VERIFICATION_KEY);
              setToken(null);
              setUser(null);
            }
          } else {
            // Reuse cached verification
            console.log('Using cached token verification');
            const userData = await verifyToken(storedToken);
            if (userData) {
              setUser(userData);
            }
          }
        }
        
        setTokenVerificationAttempted(true);
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_VERIFICATION_KEY);
        setToken(null);
        setUser(null);
        setTokenVerificationAttempted(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiLogin(email, password);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(TOKEN_VERIFICATION_KEY, Date.now().toString());
      setTokenVerificationAttempted(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setIsLoading(true);
    try {
      const result = await apiSignup(userData);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(TOKEN_VERIFICATION_KEY, Date.now().toString());
      setTokenVerificationAttempted(true);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_VERIFICATION_KEY);
    setTokenVerificationAttempted(true);
  };

  const refreshAuth = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const userData = await verifyToken(token);
      if (userData) {
        setUser(userData);
        localStorage.setItem(TOKEN_VERIFICATION_KEY, Date.now().toString());
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, we would call the API to send a reset email
      console.log(`Password reset requested for email: ${email}`);
      // Mock success response
      return Promise.resolve();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        tokenVerificationAttempted,
        login,
        signup,
        logout,
        resetPassword,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get the current auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};