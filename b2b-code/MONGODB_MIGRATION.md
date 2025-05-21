# MongoDB Migration Guide

This project has been migrated from Firebase to MongoDB. Below is information about the migration and how to set up MongoDB for this application.

## Migration Overview

The following services have been migrated:

1. **Firebase Authentication** → MongoDB with JWT-based authentication
2. **Firestore Database** → MongoDB collections
3. **Firebase Storage** → Placeholder for external storage service

## Setup Instructions

### 1. MongoDB Setup

You can use either MongoDB Atlas (cloud) or MongoDB Community Edition (local):

#### MongoDB Atlas (Recommended for Production)

1. Create an account and cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string from Atlas
3. Update the `.env` file with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-address>/legal-b2b
   ```

#### MongoDB Community Edition (For Development)

1. [Download and install MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. The default local connection string is already set in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/legal-b2b
   ```

### 2. Environment Variables

Ensure your `.env` file has the following variables:

```
# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/legal-b2b

# JWT Secret - change this to a secure random string in production
JWT_SECRET=your-secret-key-change-this-in-production

# JWT Expiry (in format like '1d', '2h', '7d')
JWT_EXPIRY=3d
```

### 3. Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## MongoDB Collections

The application uses the following MongoDB collections:

- **Users**: User accounts and profiles
- **Cases**: Legal cases
- **Clients**: Client information
- **Documents**: Document metadata
- **Tasks**: Task information

## Authentication

The authentication system now uses JWT tokens instead of Firebase Auth:

- Tokens are stored in localStorage
- Token expiration is set to 3 days by default
- Password reset and email verification would need additional setup

## File Storage

The current implementation includes placeholder functions for file storage. For a complete solution:

1. Set up AWS S3, Azure Blob Storage, or similar service
2. Update the `storageService.ts` with actual implementation
3. Configure appropriate environment variables for your storage service

## Data Migration

To migrate existing data from Firebase to MongoDB:

1. Export data from Firebase Firestore
2. Transform the data to match MongoDB schemas
3. Import the data into MongoDB collections

A separate script would be needed for this task, which is not included in this migration. 