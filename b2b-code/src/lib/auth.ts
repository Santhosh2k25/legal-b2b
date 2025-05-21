// Utility functions for authentication
// This file is specifically for server-side code to avoid dependency on browser-specific code

// For client-side code, we directly access localStorage in contexts/AuthContext.tsx
// For server-side code, we need to get the token from headers or other sources

// This is a placeholder function that will be replaced with appropriate logic
// when used in server code - the function itself will be imported but not called 
// from server code directly
export const getAuthToken = (): string | null => {
  // This function should not be called in server context
  // It's here for type consistency with the client-side version
  if (typeof window === 'undefined') {
    console.warn('getAuthToken called in server context');
    return null;
  }
  
  // This matches the implementation in AuthContext.tsx
  return localStorage.getItem('auth_token');
};

// Helper to extract token from authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}; 