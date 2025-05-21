import User from './User';
import Case from './Case';
import Client from './Client';
import Document from './Document';
import Task from './Task';

// This file imports all models to ensure they are initialized
export {
  User,
  Case,
  Client,
  Document,
  Task
};

// Function to initialize all models
export function initializeModels() {
  // Check if we're in browser environment
  const isNodeEnv = typeof process !== 'undefined' && process.version !== undefined;
  
  console.log(`Initializing models in ${isNodeEnv ? 'server' : 'browser'} environment...`);
  
  // In browser, return empty object versions of models
  if (!isNodeEnv) {
    console.log('Using API-based data access in browser environment');
  }
  
  return {
    User,
    Case,
    Client,
    Document,
    Task
  };
} 