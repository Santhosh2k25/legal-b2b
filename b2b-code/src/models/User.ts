import { getMongoose } from '../lib/db';
import { Schema, model, Document, Model, Types } from 'mongoose';

// Get mongoose instance
// console.log('Initializing User model');
const mongoose = getMongoose();

if (mongoose) {
  // console.log('Mongoose instance found, will create User model');
  // console.log('Mongoose version:', mongoose.version);
  // console.log('Mongoose connection state:', mongoose.connection.readyState);
  
  // Check if db is connected
  if (mongoose.connection.readyState === 1) {
    console.log('Mongoose is connected to MongoDB');
    console.log('Connected to database:', mongoose.connection.name);
  } else {
    console.warn('Mongoose is not connected to MongoDB yet!');
  }
} else {
  console.warn('No mongoose instance available in User model initialization');
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // Stored hashed
  displayName?: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  website?: string;
  barCouncilNumber?: string;
  practiceType?: string;
  gender?: string;
  aadhaarNumber?: string;
  userType: 'lawyer' | 'client' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Only create model on server side
let User: Model<IUser>;

// Check if mongoose is available (server-side)
if (mongoose) {
  const UserSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String },
    photoURL: { type: String },
    phone: { type: String },
    address: { type: String },
    website: { type: String },
    barCouncilNumber: { type: String },
    practiceType: { type: String },
    gender: { type: String },
    aadhaarNumber: { type: String },
    userType: { type: String, enum: ['lawyer', 'client', 'admin'], default: 'lawyer' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  // Pre-save middleware to update the updatedAt field
  UserSchema.pre('save', function(next) {
    console.log('User pre-save middleware called');
    this.updatedAt = new Date();
    next();
  });

  // Add a post-save hook to verify data was saved
  UserSchema.post('save', function(doc) {
    console.log('User saved successfully:', doc._id);
    console.log('User data:', JSON.stringify({
      id: doc._id,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      userType: doc.userType
    }));
  });

  // Virtual for full name
  UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
  });

  // Create the model
  try {
    // Check if model already exists to prevent duplicate model error
    if (mongoose.models && mongoose.models.User) {
      console.log('Using existing User model:', mongoose.models.User.modelName, mongoose.models.User.collection.name);
      User = mongoose.models.User as Model<IUser>;
    } else {
      console.log('Creating new User model with collection name "users"');
      User = model<IUser>('User', UserSchema, 'users');
      console.log('User model created successfully:', User.modelName);
      console.log('User collection name:', User.collection.name);
    }
  } catch (error) {
    console.error('Error creating User model:', error);
    // Create a dummy model if there was an error
    User = {} as Model<IUser>;
  }
} else {
  console.warn('Creating dummy User model for client-side');
  // Create a dummy model for client-side
  User = {} as Model<IUser>;
}

export default User; 