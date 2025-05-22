import 'regenerator-runtime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/config';
import App from './App.tsx';
import './index.css';

// Start the app
const startApp = () => {
  try {
    console.log('Starting application...');
    
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
    
    console.log('✅ App started successfully');
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
