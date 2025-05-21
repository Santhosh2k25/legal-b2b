// This file provides a unified interface for database operations
// It automatically chooses between direct MongoDB connections (server)
// and API-based access (browser)

// Detect environment
const isServer = typeof window === 'undefined';

// Import the appropriate implementation based on environment
let serverDB: any = null;

// Only import modules when needed to avoid "process is not defined" errors
// Use a more straightforward approach with less dynamic behavior
if (isServer) {
  // Server-side: Use direct MongoDB connection
  try {
    // In Node.js environment, we can safely require these modules
    const mongoDbModule = require('../config/mongodb');
    serverDB = mongoDbModule;
    
    // Verify that the module was loaded correctly
    if (!serverDB || !serverDB.default) {
      console.error('MongoDB module loaded but mongoose instance is not available');
    }
  } catch (err) {
    console.error('Failed to load MongoDB module:', err);
  }
}

// Expose unified methods that work in both environments
export const connectDB = async (): Promise<void> => {
  if (isServer && serverDB) {
    try {
      await serverDB.connectDB();
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error);
      throw error;
    }
    return;
  } else if (!isServer) {
    // For browsers, we'll use API-based access, no actual connection needed
    return Promise.resolve();
  }
  console.warn('Database module not loaded yet, connection attempt skipped');
  return Promise.resolve();
};

export const closeDB = async (): Promise<void> => {
  if (isServer && serverDB) {
    return serverDB.closeDB();
  }
  return Promise.resolve();
};

// Export the appropriate mongoose instance for model creation
export const getMongoose = () => {
  if (isServer && serverDB) {
    if (!serverDB.default) {
      console.error('serverDB.default is not available, mongoose instance will be null');
    }
    return serverDB.default;
  }
  return null;
};