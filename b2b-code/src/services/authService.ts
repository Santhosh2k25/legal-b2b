import User, { IUser } from '../models/User';
import { validatePassword } from './mongodb';
import { connectDB } from '../lib/db';
import axios from 'axios';
import { getClientEnv } from '../lib/config';
import bcrypt from 'bcryptjs';

// Get the base API URL without any trailing slash
const API_URL = getClientEnv().API_URL.endsWith('/') 
  ? getClientEnv().API_URL.slice(0, -1) 
  : getClientEnv().API_URL;
  
console.log('API URL for auth service:', API_URL);
const isClient = typeof window !== 'undefined';

// Helper function to construct correct API endpoints
const getEndpointUrl = (path: string) => {
  // Check if API_URL already includes '/api'
  const hasApiPrefix = API_URL.endsWith('/api') || API_URL.includes('/api/');
  
  // If path already starts with 'api/'
  if (path.startsWith('api/')) {
    // If API_URL already has /api, remove it from path
    if (hasApiPrefix) {
      const trimmedPath = path.replace(/^api\//, '');
      return `${API_URL}/${trimmedPath}`;
    }
    return `${API_URL}/${path}`;
  }
  
  // Path doesn't start with api/
  if (hasApiPrefix) {
    return `${API_URL}/${path}`;
  }
  
  // If neither has /api, add it
  return `${API_URL}/api/${path}`;
};

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  photoURL?: string;
  userType: 'lawyer' | 'client' | 'admin';
}

// Create a mock JWT token for testing
const createMockToken = (user: AuthUser): string => {
  return `mock-jwt-token-${user.id}-${Date.now()}`;
};

// Ensure MongoDB connection before performing operations
async function ensureConnection() {
  if (isClient) return; // No need to connect in browser
  
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed. Please try again later.');
  }
}

// Login user with email and password
export const login = async (email: string, password: string): Promise<{ user: AuthUser; token: string }> => {
  try {
    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (isClient) {
      // In browser, use API
      try {
        const endpoint = getEndpointUrl('auth/login');
        console.log('Login API endpoint:', endpoint);
        
        const response = await axios.post(endpoint, {
          email,
          password
        });
        
        return response.data;
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.response && error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    } else {
      // On server, use MongoDB directly
      await ensureConnection();
      
      const user = await User.findOne({ email }).exec();
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Validate the password
      const isPasswordValid = await validatePassword(user, password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      const authUser: AuthUser = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        photoURL: user.photoURL,
        userType: user.userType
      };
      
      const token = createMockToken(authUser);
      return { user: authUser, token };
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register new user
export const signup = async (userData: any): Promise<{ user: AuthUser; token: string }> => {
  try {
    console.log('authService signup called with userData:', userData);
    
    // Check required fields
    if (!userData.email || !userData.password) {
      console.error('Missing required fields:', {
        email: !!userData.email, 
        password: !!userData.password
      });
      throw new Error('Email and password are required');
    }
    
    if (isClient) {
      // In browser, use API
      try {
        const endpoint = getEndpointUrl('auth/register');
        console.log('Registration API endpoint:', endpoint);
        
        // Ensure userType is valid
        const validUserTypes = ['lawyer', 'client', 'admin'];
        if (!userData.userType || !validUserTypes.includes(userData.userType)) {
          console.log(`Invalid userType "${userData.userType}", defaulting to "admin"`);
          userData.userType = 'admin';
        }
        
        console.log('Request data:', {
          email: userData.email,
          firstName: userData.firstName || 'not set',
          lastName: userData.lastName || 'not set',
          userType: userData.userType,
          displayName: userData.displayName
        });
        
        const response = await axios.post(endpoint, userData);
        console.log('Registration API response:', response.status, response.statusText);
        return response.data;
      } catch (error: any) {
        console.error('API registration failed:', error.message);
        if (error.response) {
          console.error('Error response:', error.response.status, error.response.data);
        }
        if (error.response && error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    } else {
      // On server, use MongoDB directly
      await ensureConnection();
      
      const existingUser = await User.findOne({ email: userData.email }).exec();
      if (existingUser) {
        throw new Error('Email already registered');
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with hashed password
      const userToCreate = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await User.create(userToCreate);
      
      const authUser: AuthUser = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        photoURL: user.photoURL,
        userType: user.userType
      };
      
      const token = createMockToken(authUser);
      return { user: authUser, token };
    }
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Verify token and return user data
export const verifyToken = async (token: string): Promise<AuthUser | null> => {
  try {
    if (isClient) {
      // In browser, use API
      try {
        const endpoint = getEndpointUrl('auth/verify');
        console.log('Token verification endpoint:', endpoint);
        
        const response = await axios.post(endpoint, { token });
        return response.data.user;
      } catch (error) {
        console.error('Token verification error:', error);
        return null;
      }
    } else {
      // On server, verify directly
      // Parse our mock token to extract the user ID
      if (token.startsWith('mock-jwt-token-')) {
        const parts = token.split('-');
        if (parts.length < 4) return null;
        
        const userId = parts[3]; // Extract the mock user ID
        
        await ensureConnection();
        const user = await User.findById(userId).exec();
        
        if (!user) return null;
        
        return {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          photoURL: user.photoURL,
          userType: user.userType
        };
      }
    }
  } catch (error) {
    console.error('Token verification error:', error);
  }
  
  return null;
};

// Update user profile
export const updateUserProfile = async (userId: string, data: any) => {
  try {
    if (isClient) {
      // In browser, use API
      const endpoint = getEndpointUrl(`users/${userId}/profile`);
      const response = await axios.put(endpoint, data);
      return response.data;
    } else {
      // On server, update directly
      await ensureConnection();
      
      const updatedUser = await User.findByIdAndUpdate(userId, data, { new: true }).exec() as IUser;
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      // Create auth user object with updated data
      const authUser: AuthUser = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        userType: updatedUser.userType
      };
      
      return authUser;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Update user password
export const updateUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  try {
    if (isClient) {
      // In browser, use API
      const endpoint = getEndpointUrl(`users/${userId}/change-password`);
      await axios.post(endpoint, {
        currentPassword,
        newPassword
      });
      return;
    } else {
      // On server, update directly
      await ensureConnection();
      
      const user = await User.findById(userId).exec() as IUser;
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const isValid = await validatePassword(user, currentPassword);
      
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await User.findByIdAndUpdate(userId, { password: hashedPassword }).exec();
    }
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

// Update user email
export const updateUserEmail = async (userId: string, email: string) => {
  try {
    if (isClient) {
      // In browser, use API
      const endpoint = getEndpointUrl(`users/${userId}/change-email`);
      const response = await axios.post(endpoint, { email });
      return response.data;
    } else {
      // On server, update directly
      await ensureConnection();
      
      const existingUser = await User.findOne({ email }).exec() as IUser;
      
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Email already in use');
      }
      
      const updatedUser = await User.findByIdAndUpdate(userId, { email }, { new: true }).exec() as IUser;
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      // Create auth user object with updated data
      const authUser: AuthUser = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        userType: updatedUser.userType
      };
      
      return authUser;
    }
  } catch (error) {
    console.error('Update email error:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string) => {
  try {
    if (isClient) {
      // In browser, use API
      const endpoint = getEndpointUrl('auth/reset-password');
      await axios.post(endpoint, { email });
      return;
    } else {
      // On server, handle directly
      await ensureConnection();
      
      const user = await User.findOne({ email }).exec() as IUser;
      
      if (!user) {
        // For security reasons, don't reveal if email exists or not
        return;
      }
      
      // In a real implementation, you would:
      // 1. Generate a reset token and save it to the database with an expiry
      // 2. Send an email with a link containing the token
      // 3. When the user clicks the link, validate the token and allow password reset
      
      // For now, just return success
      console.log(`Password reset email would be sent to ${email}`);
    }
  } catch (error) {
    console.error('Send password reset email error:', error);
    throw error;
  }
}; 