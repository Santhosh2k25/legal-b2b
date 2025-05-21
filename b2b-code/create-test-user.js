// Script to create a test user in MongoDB
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legal-b2b';
console.log('Connecting to MongoDB at:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//******:******@'));

// Define user schema (matching the application's User model schema in src/models/User.ts)
const userSchema = new mongoose.Schema({
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

// Create the User model with the same collection name as in the application
const User = mongoose.model('User', userSchema, 'users');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists with email: test@example.com');
      console.log('You can login with:');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      await mongoose.connection.close();
      return;
    }

    // Create a test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const newUser = new User({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      userType: 'admin',
      phone: '1234567890',
      address: '123 Test Street',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();
    console.log('Test user created successfully!');
    console.log('You can login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error creating test user:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the function
createTestUser(); 