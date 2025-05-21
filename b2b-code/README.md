# Legal B2B Application

A modern web application for legal professionals to manage cases, documents, and client relationships.

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Start development servers:
   ```
   npm run start:dev
   ```
   
## Deployment to Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas account (or other MongoDB provider)

### Steps

1. **Set Up MongoDB**
   - Create a MongoDB Atlas cluster
   - Get your MongoDB connection string

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add the following environment variables in Vercel project settings:
     - `MONGODB_URI` - Your MongoDB connection string
     - `JWT_SECRET` - Secret key for JWT authentication
     - `API_URL` - The URL of your API (usually your Vercel app URL)
     - `VITE_API_URL` - Same as API_URL (for frontend)

3. **Deploy**
   - Vercel will automatically deploy your application using the settings in `vercel.json`
   - All API routes will be handled by Vercel Functions

## Features

- Document management
- Case tracking
- Client management
- Task management
- User authentication 