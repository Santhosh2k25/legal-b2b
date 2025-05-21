import axios from 'axios';
import { getClientEnv } from '../lib/config';
import { getAuthToken } from '../lib/auth';

// Get the base API URL without any trailing slash
const API_URL = getClientEnv().API_URL.endsWith('/') 
  ? getClientEnv().API_URL.slice(0, -1) 
  : getClientEnv().API_URL;

const isClient = typeof window !== 'undefined';

// Interface for Case data
export interface Case {
  id: string;
  title: string;
  caseNumber: string;
  clientId: string;
  status: string;
  courtName?: string;
  caseType?: string;
  filingDate?: string;
  nextHearingDate?: string;
  opposingParty?: string;
  opposingCounsel?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// Get cases for the current user
export const getCases = async (): Promise<Case[]> => {
  try {
    if (!isClient) {
      throw new Error('This function is only available in the browser');
    }
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get(`${API_URL}/api/cases`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
};

// Get a single case by ID
export const getCaseById = async (caseId: string): Promise<Case> => {
  try {
    if (!isClient) {
      throw new Error('This function is only available in the browser');
    }
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get(`${API_URL}/api/cases/${caseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching case:', error);
    throw error;
  }
};

// Create a new case
export const createCase = async (caseData: Partial<Case>): Promise<Case> => {
  try {
    if (!isClient) {
      throw new Error('This function is only available in the browser');
    }
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/api/cases`, caseData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

// Update an existing case
export const updateCase = async (caseId: string, caseData: Partial<Case>): Promise<Case> => {
  try {
    if (!isClient) {
      throw new Error('This function is only available in the browser');
    }
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.put(`${API_URL}/api/cases/${caseId}`, caseData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
};

// Delete a case
export const deleteCase = async (caseId: string): Promise<void> => {
  try {
    if (!isClient) {
      throw new Error('This function is only available in the browser');
    }
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    await axios.delete(`${API_URL}/api/cases/${caseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error deleting case:', error);
    throw error;
  }
};