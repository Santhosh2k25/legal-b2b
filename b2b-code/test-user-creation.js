// Direct test script for User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string - use the same one as your application
const MONGODB_URI = 'mongodb://127.0.0.1:27017/legal-b2b';

// Create a schema that matches your User model
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String },
  photoURL: { type: String },
  phone: { type: String },
  address: { type: String },
  website: { type: String },
  userType: { 
    type: String, 
    enum: ['lawyer', 'client', 'admin'], 
    default: 'admin' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

async function testUserCreation() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connection successful!');
    
    // Create the User model directly
    const User = mongoose.model('User', UserSchema, 'users');
    console.log('User model created with collection:', User.collection.name);
    
    // Create test user data with a hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test123!', salt);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${timestamp}@example.com`,
      password: hashedPassword,
      displayName: 'Test User',
      userType: 'admin'
    };
    
    console.log('Creating test user with email:', userData.email);
    
    // Create a new user instance
    const user = new User(userData);
    
    // Save the user to the database
    const result = await user.save();
    console.log('✅ User created successfully with ID:', result._id);
    
    // Verify we can retrieve it
    const retrievedUser = await User.findById(result._id);
    console.log('✅ User retrieval successful:', retrievedUser.email);
    
    // Find the user by email
    const userByEmail = await User.findOne({ email: userData.email });
    console.log('✅ User findOne by email successful:', userByEmail.email);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testUserCreation(); 