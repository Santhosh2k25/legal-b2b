import 'regenerator-runtime/runtime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/config';
import App from './App.tsx';
import './index.css';
import { connectDB, getMongoose } from './lib/db';
import { initializeModels } from './models';

// Initialize MongoDB connection
const initDB = async () => {
  try {
    console.log('Initializing MongoDB connection...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Initialize all models
    const models = initializeModels();
    console.log('MongoDB models initialized:', Object.keys(models).join(', '));
    
    console.log('MongoDB initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
    // Continue with app initialization even if MongoDB fails
    return false;
  }
};

// Start the app
const startApp = async () => {
  try {
    console.log('Starting application...');
    
    // Start the app first
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    // Then try to connect to MongoDB
    const dbConnected = await initDB();
    
    if (!dbConnected) {
      console.warn('⚠️ App started without MongoDB connection. Some features may not work.');
    } else {
      console.log('✅ App started successfully with MongoDB connection');
    }
  } catch (error) {
    console.error('Failed to start app:', error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <div style={{ 
          padding: '20px', 
          color: 'red', 
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>Application Error</h1>
          <p>Failed to start the application. Please try refreshing the page.</p>
          <p>If the problem persists, please contact support.</p>
          <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        </div>
      );
    }
  }
};

// Start the application
startApp();
