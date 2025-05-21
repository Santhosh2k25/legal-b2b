// This file provides browser-safe alternatives to direct MongoDB connections
// It uses the API endpoints instead of direct database access

import axios from 'axios';
import { getClientEnv } from '../lib/config';

const API_URL = getClientEnv().API_URL;

// Mock connection function for client-side
export async function connectDB(): Promise<void> {
  console.log('Using browser-safe MongoDB connection via API');
  // No actual connection needed in browser
  return;
}

// Get data from a collection via API
export async function getCollection(collection: string) {
  try {
    const response = await axios.get(`${API_URL}/${collection}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting ${collection}:`, error);
    return [];
  }
}

// Add an item to a collection via API
export async function addToCollection(collection: string, item: any) {
  try {
    const response = await axios.post(`${API_URL}/${collection}`, item);
    return response.data;
  } catch (error) {
    console.error(`Error adding to ${collection}:`, error);
    throw error;
  }
}

// Update an item in a collection via API
export async function updateInCollection(collection: string, id: string, updates: any) {
  try {
    const response = await axios.put(`${API_URL}/${collection}/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating in ${collection}:`, error);
    throw error;
  }
}

// Delete an item from a collection via API
export async function deleteFromCollection(collection: string, id: string) {
  try {
    const response = await axios.delete(`${API_URL}/${collection}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting from ${collection}:`, error);
    throw error;
  }
}

// Mock closeDB function for client-side
export async function closeDB(): Promise<void> {
  // No actual connection to close in browser
  return;
} 