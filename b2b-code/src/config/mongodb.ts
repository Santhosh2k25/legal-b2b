import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Only load environment variables in Node.js environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  dotenv.config();
}

// Get MongoDB connection URI from environment variables
const MONGODB_URI = typeof process !== 'undefined' 
  ? (process.env.MONGODB_URI || "mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b")
  : "mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b";

// Connection state tracking
let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

// Export mongoose as default for direct imports
export default mongoose;

// Connect to MongoDB
export async function connectDB(): Promise<void> {
  // If already connected, return quietly
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // If connection attempt is in progress, return that promise
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  try {
    console.log('Connecting to MongoDB...');

    // Set connection options for serverless
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
      maxPoolSize: 1, // Reduced for serverless
      minPoolSize: 0, // Allow connection to close when idle
      connectTimeoutMS: 10000,
    };

    // Store connection promise to reuse for concurrent calls
    connectionPromise = mongoose.connect(MONGODB_URI, options);
    
    // Wait for connection
    await connectionPromise;
    
    isConnected = true;
    console.log('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
      isConnected = false;
      connectionPromise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
      isConnected = false;
      connectionPromise = null;
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    connectionPromise = null;
    throw error;
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
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}; 