import User from '../models/User';
import Case from '../models/Case';
import Client from '../models/Client';
import DocumentModel from '../models/Document';
import Task from '../models/Task';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Convert MongoDB _id to string id
const convertToPlainObject = (doc: any) => {
  if (!doc) return null;
  
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  
  // Convert _id to id
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  
  // Convert date fields to ISO strings
  Object.keys(obj).forEach(key => {
    if (obj[key] instanceof Date) {
      obj[key] = obj[key].toISOString();
    } else if (obj[key] instanceof Types.ObjectId) {
      obj[key] = obj[key].toString();
    }
  });

  return obj;
};

// User Authentication Services
export const createUser = async (userData: any) => {
  try {
    console.log('MongoDB createUser called with email:', userData.email);
    console.log('MongoDB userData fields:', Object.keys(userData).join(', '));
    
    // Explicitly ensure MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected. Attempting to connect...');
      await mongoose.connect('mongodb://127.0.0.1:27017/legal-b2b', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB connected in createUser function');
    }
    
    // Ensure required fields are present
    if (!userData.email || !userData.password) {
      console.error('Required fields missing:', {
        email: !!userData.email,
        password: !!userData.password
      });
      throw new Error('Email and password are required for user creation');
    }
    
    // Ensure firstName and lastName are set with defaults if missing
    if (!userData.firstName) {
      console.log('Setting default firstName from displayName or email');
      userData.firstName = (userData.displayName || userData.email).split(' ')[0];
    }
    
    if (!userData.lastName) {
      console.log('Setting default lastName');
      userData.lastName = userData.displayName ? 
        userData.displayName.split(' ').slice(1).join(' ') : 
        '';
    }
    
    // Ensure userType is valid
    const validUserTypes = ['lawyer', 'client', 'admin'];
    if (!userData.userType || !validUserTypes.includes(userData.userType)) {
      console.log(`Invalid userType "${userData.userType}", defaulting to "admin"`);
      userData.userType = 'admin';
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    console.log('Password hashed successfully');
    
    // Create user with hashed password
    const userToCreate = {
      ...userData,
      password: hashedPassword
    };
    
    console.log('Creating user model with fields:', Object.keys(userToCreate).join(', '));
    
    // Check if User model is properly initialized
    if (!User || !User.modelName) {
      console.error('User model is not properly initialized!');
      throw new Error('User model is not available');
    }
    
    const user = new User(userToCreate);
    console.log('User model instance created:', user._id);
    console.log('About to save user to collection:', User.collection.name);
    
    try {
      await user.save();
      console.log('User saved successfully to MongoDB with _id:', user._id);
    } catch (saveError: any) {
      console.error('Error saving user:', saveError.message);
      if (saveError.name === 'ValidationError') {
        console.error('Mongoose validation error:', saveError.errors);
      }
      throw saveError;
    }
    
    const result = convertToPlainObject(user);
    console.log('User converted to plain object, returning with id:', result.id);
    
    return result;
  } catch (error: any) {
    console.error('Error creating user in MongoDB:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
      // Format mongoose validation errors
      const validationErrors = Object.keys(error.errors || {}).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      
      throw new Error(`Validation failed: ${validationErrors || error.message}`);
    }
    
    if (error.code === 11000) { // Duplicate key error
      console.error('Duplicate key error:', error);
      throw new Error('Email already in use');
    }
    
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    return user ? convertToPlainObject(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    return user ? convertToPlainObject(user) : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    // If updating password, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    return user ? convertToPlainObject(user) : null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const validatePassword = async (user: any, password: string) => {
  return bcrypt.compare(password, user.password);
};

// Case Services
export const addCase = async (caseData: any) => {
  try {
    console.log('MongoDB service: Adding case with data:', JSON.stringify(caseData, null, 2));
    
    // Ensure client is a valid ObjectId
    if (typeof caseData.client === 'string') {
      console.log('Converting client string ID to ObjectId:', caseData.client);
      caseData.client = new Types.ObjectId(caseData.client);
    }
    
    const newCase = new Case(caseData);
    console.log('Created new Case instance');
    
    // Validate the case before saving
    const validationError = newCase.validateSync();
    if (validationError) {
      console.error('Case validation failed:', validationError);
      throw validationError;
    }
    
    await newCase.save();
    console.log('Case saved successfully');
    return (newCase as any)._id.toString();
  } catch (error) {
    console.error('Error adding case:', error);
    throw error;
  }
};

export const getCases = async (userId: string) => {
  try {
    const cases = await Case.find({ userId })
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
    
    return cases.map(convertToPlainObject);
  } catch (error) {
    console.error('Error getting cases:', error);
    throw error;
  }
};

export const updateCase = async (caseId: string, updates: any) => {
  try {
    await Case.findByIdAndUpdate(caseId, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
};

export const deleteCase = async (caseId: string) => {
  try {
    await Case.findByIdAndDelete(caseId);
  } catch (error) {
    console.error('Error deleting case:', error);
    throw error;
  }
};

// Client Services
export const addClient = async (clientData: any) => {
  try {
    const client = new Client(clientData);
    await client.save();
    return (client as any)._id.toString();
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

export const getClients = async (userId: string) => {
  try {
    const clients = await Client.find({ userId }).sort({ name: 1 });
    return clients.map(convertToPlainObject);
  } catch (error) {
    console.error('Error getting clients:', error);
    throw error;
  }
};

export const updateClient = async (clientId: string, updates: any) => {
  try {
    await Client.findByIdAndUpdate(clientId, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (clientId: string) => {
  try {
    await Client.findByIdAndDelete(clientId);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Document Services
export const addDocument = async (documentData: any) => {
  try {
    console.log('MongoDB service: Adding document with data:', JSON.stringify(documentData, null, 2));
    
    // Process the document data to match the schema
    const processedDocumentData: any = {
      title: documentData.name || documentData.title || 'Untitled Document',
      description: documentData.description || '',
      fileUrl: documentData.url || documentData.fileUrl || 'placeholder-url',
      fileType: documentData.type || documentData.fileType || 'application/pdf',
      fileSize: documentData.size || documentData.fileSize || 0,
      userId: documentData.userId,
      tags: documentData.tags || []
    };
    
    // If caseId is provided and is a string, convert to ObjectId
    if (documentData.caseId && typeof documentData.caseId === 'string' && documentData.caseId.trim() !== '') {
      try {
        processedDocumentData.caseId = new Types.ObjectId(documentData.caseId);
      } catch (e) {
        console.warn('Invalid caseId format, skipping:', documentData.caseId);
      }
    } else if (documentData.case && typeof documentData.case === 'string' && documentData.case.trim() !== '') {
      // Handle 'case' field from frontend
      if (documentData.case !== 'Unassigned') {
        try {
          // Try to convert to ObjectId if it looks like one
          if (/^[0-9a-fA-F]{24}$/.test(documentData.case)) {
            processedDocumentData.caseId = new Types.ObjectId(documentData.case);
          } else {
            // Or store as a tag
            processedDocumentData.tags.push(`case:${documentData.case}`);
          }
        } catch (e) {
          console.warn('Invalid case format, adding as tag:', documentData.case);
          processedDocumentData.tags.push(`case:${documentData.case}`);
        }
      }
    }
    
    // If clientId is provided and is a string, convert to ObjectId
    if (documentData.clientId && typeof documentData.clientId === 'string' && documentData.clientId.trim() !== '') {
      try {
        processedDocumentData.clientId = new Types.ObjectId(documentData.clientId);
      } catch (e) {
        console.warn('Invalid clientId format, skipping:', documentData.clientId);
      }
    }
    
    console.log('Processed document data:', JSON.stringify(processedDocumentData, null, 2));
    
    const document = new DocumentModel(processedDocumentData);
    
    // Validate the document before saving
    const validationError = document.validateSync();
    if (validationError) {
      console.error('Document validation failed:', validationError);
      throw validationError;
    }
    
    await document.save();
    console.log('Document saved successfully with ID:', document._id);
    return (document as any)._id.toString();
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const getDocuments = async (userId: string) => {
  try {
    const documents = await DocumentModel.find({ userId })
      .populate('caseId', 'title')
      .populate('clientId', 'name')
      .sort({ createdAt: -1 });
      
    return documents.map(convertToPlainObject);
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

export const updateDocument = async (documentId: string, updates: any) => {
  try {
    await DocumentModel.findByIdAndUpdate(documentId, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    await DocumentModel.findByIdAndDelete(documentId);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Task Services
export const addTask = async (taskData: any) => {
  try {
    console.log('MongoDB service: Adding task with data:', JSON.stringify(taskData, null, 2));
    
    // Process the task data to match the schema
    const processedTaskData: any = {
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status?.toLowerCase() === 'pending' ? 'pending' :
              taskData.status?.toLowerCase() === 'completed' ? 'completed' :
              taskData.status?.toLowerCase() === 'in progress' ? 'in-progress' :
              taskData.status?.toLowerCase() === 'cancelled' ? 'cancelled' : 'pending',
      priority: taskData.priority?.toLowerCase() === 'high' ? 'high' :
                taskData.priority?.toLowerCase() === 'medium' ? 'medium' :
                taskData.priority?.toLowerCase() === 'low' ? 'low' : 'medium',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      notes: taskData.notes || taskData.description || '',
      userId: taskData.userId
    };
    
    // If caseId is provided and is a string, convert to ObjectId
    if (taskData.caseId && typeof taskData.caseId === 'string' && taskData.caseId.trim() !== '') {
      try {
        processedTaskData.caseId = new Types.ObjectId(taskData.caseId);
      } catch (e) {
        console.warn('Invalid caseId format, skipping:', taskData.caseId);
      }
    }
    
    // If clientId is provided and is a string, convert to ObjectId
    if (taskData.clientId && typeof taskData.clientId === 'string' && taskData.clientId.trim() !== '') {
      try {
        processedTaskData.clientId = new Types.ObjectId(taskData.clientId);
      } catch (e) {
        console.warn('Invalid clientId format, skipping:', taskData.clientId);
      }
    }
    
    console.log('Processed task data:', JSON.stringify(processedTaskData, null, 2));
    
    const task = new Task(processedTaskData);
    
    // Validate the task before saving
    const validationError = task.validateSync();
    if (validationError) {
      console.error('Task validation failed:', validationError);
      throw validationError;
    }
    
    await task.save();
    console.log('Task saved successfully with ID:', task._id);
    return (task as any)._id.toString();
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

export const getTasks = async (userId: string) => {
  try {
    const tasks = await Task.find({ userId })
      .populate('caseId', 'title')
      .populate('clientId', 'name')
      .sort({ dueDate: 1, priority: -1 });
      
    return tasks.map(convertToPlainObject);
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: any) => {
  try {
    await Task.findByIdAndUpdate(taskId, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await Task.findByIdAndDelete(taskId);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}; 