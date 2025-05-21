const mongoose = require('mongoose');

// MongoDB connection string - use the same one as your application
const MONGODB_URI = 'mongodb://127.0.0.1:27017/legal-b2b';

console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  
  // Create a simple test schema and model
  const TestSchema = new mongoose.Schema({
    name: String,
    date: { type: Date, default: Date.now }
  });
  
  // Create model
  const TestModel = mongoose.model('TestEntry', TestSchema);
  
  // Create a test document
  const testDoc = new TestModel({ name: 'Test Entry ' + new Date().toISOString() });
  
  // Save the test document
  return testDoc.save();
})
.then(savedDoc => {
  console.log(`✅ Test document saved successfully with ID: ${savedDoc._id}`);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB Test Error:', err);
  process.exit(1);
}); 