import { useState, useEffect } from 'react';
import axios from 'axios';
import { getClientEnv } from '../lib/config';
import { getAuthToken } from '../contexts/AuthContext';

// Get the base API URL without any trailing slash
const API_URL = getClientEnv().API_URL.endsWith('/') 
  ? getClientEnv().API_URL.slice(0, -1) 
  : getClientEnv().API_URL;

// Debug log to help troubleshoot API URL issues
console.log('API URL in useMongoDB:', API_URL);

export const useMongoDB = (collection: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<boolean>(false);

  // Ensure the collection name is properly formatted for the API endpoint
  const getEndpointUrl = (collectionPath: string) => {
    // Check if API_URL already includes '/api'
    const hasApiPrefix = API_URL.endsWith('/api') || API_URL.includes('/api/');
    
    // If collection already starts with 'api/'
    if (collectionPath.startsWith('api/')) {
      // If API_URL already has /api, remove it from collection path
      if (hasApiPrefix) {
        const trimmedPath = collectionPath.replace(/^api\//, '');
        return `${API_URL}/${trimmedPath}`;
      }
      return `${API_URL}/${collectionPath}`;
    }
    
    // Collection doesn't start with api/
    if (hasApiPrefix) {
      return `${API_URL}/${collectionPath}`;
    }
    
    // If neither has /api, add it
    return `${API_URL}/api/${collectionPath}`;
  };

  // Handle authentication errors - redirect to login page
  const handleAuthError = () => {
    if (typeof window !== 'undefined') {
      // Set token error state
      setTokenError(true);
      
      // Only redirect if not already on login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
        console.log('Authentication failed, redirecting to login page');
        // Use a small timeout to ensure any state updates complete before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
  };

  // Create headers with authorization token
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      console.warn('No authentication token found');
      return null;
    }
    
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get authentication headers
        const headers = getAuthHeaders();
        if (!headers) {
          setError('Authentication required');
          setLoading(false);
          handleAuthError();
          return;
        }
        
        const endpoint = getEndpointUrl(collection);
        console.log('Fetching data from:', endpoint);
        const response = await axios.get(endpoint, { headers });
        setData(response.data);
      } catch (err: any) {
        // Check for specific error types
        if (err.response) {
          // Server responded with error status
          if (err.response.status === 401 || err.response.status === 403) {
            console.error(`Authentication error (${err.response.status}):`, err.response.data);
            setError('Authentication failed. Please log in again.');
            handleAuthError();
          } else {
            // Other API errors
            const errorMessage = err.response.data?.message || err.response.data?.error || 'Server error';
            console.error(`API error (${err.response.status}):`, errorMessage);
            setError(`Error: ${errorMessage}`);
          }
        } else if (err.request) {
          // Request made but no response received (network error)
          console.error('Network error - no response:', err.request);
          setError('Network error. Please check your connection.');
        } else {
          // Error in request setup
          console.error('Request error:', err.message);
          setError(err.message || 'An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a collection and no token error
    if (collection && !tokenError) {
      fetchData();
    }
  }, [collection, tokenError]);

  const addItem = async (item: any) => {
    try {
      // Get authentication headers
      const headers = getAuthHeaders();
      if (!headers) {
        handleAuthError();
        throw new Error('Authentication required');
      }
      
      const endpoint = getEndpointUrl(collection);
      const response = await axios.post(endpoint, item, { headers });
      
      // Add the new item to the state with its ID from the response
      const newItem = { ...item, id: response.data.id };
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err: any) {
      handleApiError(err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: any) => {
    try {
      // Get authentication headers
      const headers = getAuthHeaders();
      if (!headers) {
        handleAuthError();
        throw new Error('Authentication required');
      }
      
      const endpoint = `${getEndpointUrl(collection)}/${id}`;
      await axios.put(endpoint, updates, { headers });
      
      // Update local state
      setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    } catch (err: any) {
      handleApiError(err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // Get authentication headers
      const headers = getAuthHeaders();
      if (!headers) {
        handleAuthError();
        throw new Error('Authentication required');
      }
      
      const endpoint = `${getEndpointUrl(collection)}/${id}`;
      await axios.delete(endpoint, { headers });
      
      // Update local state
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      handleApiError(err);
      throw err;
    }
  };

  // Centralized error handling for API calls
  const handleApiError = (err: any) => {
    if (err.response) {
      if (err.response.status === 401 || err.response.status === 403) {
        handleAuthError();
      } else {
        const message = err.response.data?.message || err.response.data?.error || 'Server error';
        setError(message);
      }
    } else if (err.request) {
      setError('Network error. Please check your connection.');
    } else {
      setError(err.message || 'Unknown error');
    }
  };

  return { data, loading, error, addItem, updateItem, deleteItem };
}; 