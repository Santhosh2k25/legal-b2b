import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Detect environment - for server this is always true
const isServer = typeof process !== 'undefined' && process.version !== undefined;

// Load environment variables (only in Node.js environment)
if (isServer) {
  dotenv.config();
}

// Get MongoDB connection URI from environment variables
// Safely access environment variables based on environment
const MONGODB_URI = isServer
  ? (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legal-b2b')
  : ('mongodb://127.0.0.1:27017/legal-b2b'); // fallback

console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//******:******@')); // Hide credentials in logs

// Connection state tracking - define outside function so they're shared across imports
let isConnecting = false;
let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Static module-level variable to ensure we only log success once
// This will persist across multiple imports of this module
let hasLoggedConnectionSuccess = false;

// Export mongoose as default for direct imports
export default mongoose;

// Connect to MongoDB
export async function connectDB(): Promise<void> {
  // If already connected, return quietly
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected.');
    return;
  }

  // If connection attempt is in progress, return that promise
  if (isConnecting && connectionPromise) {
    console.log('MongoDB connection attempt already in progress, waiting...');
    await connectionPromise;
    return;
  }

  try {
    isConnecting = true;
    connectionAttempts++;

    console.log(`Connecting to MongoDB... (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);

    // Remove any existing listeners to prevent duplicate messages
    mongoose.connection.removeAllListeners('connected');
    mongoose.connection.removeAllListeners('error');
    mongoose.connection.removeAllListeners('disconnected');

    // Set connection options
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
      maxPoolSize: 10,
    };

    // Store connection promise to reuse for concurrent calls
    connectionPromise = mongoose.connect(MONGODB_URI, options);
    
    // Wait for connection
    await connectionPromise;
    
    isConnected = true;
    isConnecting = false;
    
    // Only log success message once - using module-level variable
    if (!hasLoggedConnectionSuccess) {
      console.log('MongoDB connected successfully to:', mongoose.connection.name);
      console.log('Connection state:', mongoose.connection.readyState);
      hasLoggedConnectionSuccess = true;
    }

    // Handle connection events - no logging here
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected event triggered');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
      isConnected = false;
      isConnecting = false;
      hasLoggedConnectionSuccess = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
      isConnected = false;
      isConnecting = false;
      hasLoggedConnectionSuccess = false;
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    isConnecting = false;
    connectionPromise = null;
    hasLoggedConnectionSuccess = false;
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying MongoDB connection (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
      return connectDB(); // Retry connection
    }
    
    throw new Error('Failed to connect to MongoDB after multiple attempts. Please ensure MongoDB is running and accessible.');
  }
}

// Get the MongoDB connection
export const getDB = () => mongoose.connection;

// Close the MongoDB connection
export const closeDB = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      isConnected = false;
      connectionPromise = null;
      hasLoggedConnectionSuccess = false;
      connectionAttempts = 0;
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}; 