// Config for handling environment variables in both server and client environments

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// For client-side code with Vite
export const getClientEnv = () => {
  // Use Vite's import.meta.env for client-side
  if (isBrowser) {
    try {
      return {
        // @ts-ignore - We know this exists in Vite browser context
        API_URL: (window as any).__VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
        // @ts-ignore - We know this exists in Vite browser context
        MONGODB_URI: (window as any).__VITE_MONGODB_URI || import.meta.env.VITE_MONGODB_URI,
      };
    } catch (e) {
      console.warn('Error accessing Vite env vars:', e);
    }
  }
  
  // Fallback values for Node.js environment
  return {
    API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api',
    MONGODB_URI: process.env.VITE_MONGODB_URI || 'mongodb://127.0.0.1:27017/legal-b2b',
  };
}; 