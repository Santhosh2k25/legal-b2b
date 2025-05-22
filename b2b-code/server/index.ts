import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from '../src/lib/db';
import * as mongodbService from '../src/services/mongodb';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
// Direct import of the User model for registration debugging
import User from '../src/models/User';

// Load environment variables
dotenv.config();

// Set a global flag to track if MongoDB is already connected
let mongodbConnected = false;

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '3d';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware
// Configure CORS with specific options
app.use(cors({
  origin: '*', // Accept requests from any origin in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase payload size limit for document uploads (to handle Base64 encoded files)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  // Only log non-GET requests or errors to reduce noise
  if (req.method !== 'GET') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Auth middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || typeof token !== 'string') {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  jwt.verify(token, JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
};

// Modified server startup with error handling
const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${parseInt(port.toString()) + 1}`);
      // Try a different port
      const newPort = parseInt(port.toString()) + 1;
      app.listen(newPort, () => {
        console.log(`✅ Server running at http://localhost:${newPort}`);
      });
    } else {
      console.error('Server error:', e);
    }
  });
};

// Connect to MongoDB first, then start server - ensure it only happens once
if (!mongodbConnected) {
  connectDB()
    .then(() => {
      mongodbConnected = true;
      // MongoDB connection successful, start server
      startServer();
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1); // Exit on connection failure
    });
} else {
  // If MongoDB is already connected, just start the server
  startServer();
}

// Authentication Routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:', req.body.email);
    console.log('Registration request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.email || !req.body.password) {
      console.error('Missing required fields in request:', {
        email: !!req.body.email,
        password: !!req.body.password
      });
      res.status(400).json({ 
        message: 'Email and password are required',
        details: 'Registration requires both email and password fields' 
      });
    }

    // Validate other required fields for MongoDB schema
    if (!req.body.firstName || !req.body.lastName) {
      console.error('Missing name fields in request:', {
        firstName: !!req.body.firstName,
        lastName: !!req.body.lastName
      });
      res.status(400).json({ 
        message: 'First name and last name are required',
        details: 'User registration requires both first name and last name fields' 
      });
    }
    
    // Check if userType is valid
    const validUserTypes = ['lawyer', 'client', 'admin'];
    if (req.body.userType && !validUserTypes.includes(req.body.userType)) {
      console.error('Invalid userType:', req.body.userType);
      req.body.userType = 'admin'; // Default to admin if invalid
      console.log('Changed userType to:', req.body.userType);
    }
    
    // Verify MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected in registration endpoint. Attempting to connect...');
      await connectDB();
      console.log('MongoDB connection state after reconnect:', mongoose.connection.readyState);
    }
    
    // Check if User model is available and properly initialized
    if (!User.modelName) {
      console.error('User model is not properly initialized!');
      res.status(500).json({ message: 'Database error - User model not available' });
    } else {
      console.log('User model is available:', User.modelName, User.collection.name);
    }
    
    // Check if user already exists
    const existingUser = await mongodbService.getUserByEmail(req.body.email);
    console.log('Existing user check:', existingUser ? 'User exists' : 'User does not exist');
    
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create new user
    const userData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating new user with data:', {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType
    });
    
    const user = await mongodbService.createUser(userData);
    console.log('User created successfully with ID:', user.id);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '3d' }
    );
    
    // Remove password from response
    delete user.password;
    
    // Format response to match authService expected structure
    const authUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      photoURL: user.photoURL,
      userType: user.userType || 'lawyer'
    };
    
    console.log('Registration successful for:', authUser.email);
    res.status(201).json({ user: authUser, token });
  } catch (error: any) {
    console.error('Registration error details:', error);
    
    // Provide more detailed error messages
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation error:', error.errors);
      res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    if (error.code === 11000) {
      // Duplicate key error
      res.status(409).json({ 
        message: 'Email already in use',
        details: 'This email address is already registered' 
      });
    }
    
    res.status(500).json({ message: 'Failed to register user', details: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await mongodbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Validate password
    const isPasswordValid = await mongodbService.validatePassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '3d' }
    );
    
    // Remove password from response
    delete user.password;
    
    // Format response to match authService expected structure
    const authUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      photoURL: user.photoURL,
      userType: user.userType || 'lawyer'
    };
    
    console.log('Login successful for:', authUser.email);
    res.status(200).json({ user: authUser, token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login', details: error.message });
  }
});

// New endpoint for token verification
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ message: 'Token is required' });
    }
    
    // Verify the token
    jwt.verify(token, JWT_SECRET || 'your-secret-key', async (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      // Check if user exists
      const user = await mongodbService.getUserById(decoded.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      }
      
      // Format user response to match authService
      const authUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        photoURL: user.photoURL,
        userType: user.userType || 'lawyer'
      };
      
      res.json({ user: authUser });
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Failed to verify token' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await mongodbService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    const user = await mongodbService.updateUser(req.user.id, updates);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Case Routes
app.get('/api/cases', authenticateToken, async (req: Request, res: Response) => {
  try {
    const cases = await mongodbService.getCases(req.user.id);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

app.post('/api/cases', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('Creating new case with data:', JSON.stringify(req.body, null, 2));
    
    // Check for required client field
    if (!req.body.client) {
      console.error('Missing required client field in request');
      res.status(400).json({ 
        message: 'Client is required',
        details: 'Case creation requires a client field with a valid client ID' 
      });
    }
    
    const caseData = {
      ...req.body,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Processed case data:', JSON.stringify(caseData, null, 2));
    
    const caseId = await mongodbService.addCase(caseData);
    console.log('Case created successfully with ID:', caseId);
    res.json({ id: caseId });
  } catch (error) {
    console.error('Error creating case:', error);
    // Type checking for error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create case', details: errorMessage });
  }
});

app.put('/api/cases/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    await mongodbService.updateCase(req.params.id, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update case' });
  }
});

app.delete('/api/cases/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await mongodbService.deleteCase(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Client Routes
app.get('/api/clients', authenticateToken, async (req: Request, res: Response) => {
  try {
    const clients = await mongodbService.getClients(req.user.id);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/clients', authenticateToken, async (req: Request, res: Response) => {
  try {
    const clientData = {
      ...req.body,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const clientId = await mongodbService.addClient(clientData);
    res.json({ id: clientId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    await mongodbService.updateClient(req.params.id, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await mongodbService.deleteClient(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Document Routes
app.get('/api/documents', authenticateToken, async (req: Request, res: Response) => {
  try {
    const documents = await mongodbService.getDocuments(req.user.id);
    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch documents', details: errorMessage });
  }
});

app.post('/api/documents', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('Creating new document with data:', JSON.stringify(req.body, null, 2));
    
    // Manually ensure we have a valid title and fileUrl
    const title = req.body.title || req.body.name || 'Untitled Document';
    const fileUrl = req.body.fileUrl || req.body.url || 'placeholder-url';
    
    const documentData = {
      ...req.body,
      title,
      fileUrl,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Processed document data:', JSON.stringify(documentData, null, 2));
    
    const documentId = await mongodbService.addDocument(documentData);
    console.log('Document created successfully with ID:', documentId);
    res.json({ id: documentId });
  } catch (error) {
    console.error('Error creating document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ 
        error: 'Validation error', 
        details: errorMessage 
      });
    }
    
    res.status(500).json({ error: 'Failed to create document', details: errorMessage });
  }
});

app.put('/api/documents/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    await mongodbService.updateDocument(req.params.id, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

app.delete('/api/documents/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await mongodbService.deleteDocument(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Task Routes
app.get('/api/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await mongodbService.getTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch tasks', details: errorMessage });
  }
});

app.post('/api/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('Creating new task with data:', JSON.stringify(req.body, null, 2));
    
    // Verify required fields
    if (!req.body.title) {
      console.error('Missing required title field in task request');
      res.status(400).json({ 
        message: 'Title is required',
        details: 'Task creation requires a title field' 
      });
    }
    
    const taskData = {
      ...req.body,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Processed task data:', JSON.stringify(taskData, null, 2));
    
    const taskId = await mongodbService.addTask(taskData);
    console.log('Task created successfully with ID:', taskId);
    res.json({ id: taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ 
        error: 'Validation error', 
        details: errorMessage 
      });
    }
    
    res.status(500).json({ error: 'Failed to create task', details: errorMessage });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    await mongodbService.updateTask(req.params.id, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await mongodbService.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// New endpoints for user management
app.post('/api/users/:userId/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Ensure the user is modifying their own account
    if (req.user.id !== req.params.userId) {
      res.status(403).json({ message: 'You can only change your own password' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get the user
    const user = await mongodbService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    }
    
    // Validate current password
    const isPasswordValid = await mongodbService.validatePassword(user, currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    await mongodbService.updateUser(req.user.id, { password: newPassword });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

app.post('/api/users/:userId/change-email', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Ensure the user is modifying their own account
    if (req.user.id !== req.params.userId) {
      res.status(403).json({ message: 'You can only change your own email' });
    }
    
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if email is already in use
    const existingUser = await mongodbService.getUserByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      res.status(400).json({ message: 'Email already in use' });
    }
    
    // Update email
    const updatedUser = await mongodbService.updateUser(req.user.id, { email });
    
    // Format user response
    const authUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userType: updatedUser.userType || 'lawyer'
    };
    
    res.json(authUser);
  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({ message: 'Failed to change email' });
  }
});

app.put('/api/users/:userId/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Ensure the user is modifying their own account
    if (req.user.id !== req.params.userId) {
      res.status(403).json({ message: 'You can only update your own profile' });
    }
    
    // Update profile
    const updatedUser = await mongodbService.updateUser(req.user.id, req.body);
    
    // Format user response
    const authUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userType: updatedUser.userType || 'lawyer'
    };
    
    res.json(authUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists (but don't reveal this information)
    const user = await mongodbService.getUserByEmail(email);
    
    // In a real implementation, you would:
    // 1. Generate a reset token and save it to the database with an expiry
    // 2. Send an email with a link containing the token
    
    // Just return success even if user doesn't exist (for security)
    res.json({ success: true, message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to process reset password request' });
  }
}); 