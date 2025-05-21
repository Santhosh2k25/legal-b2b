# Deploying to Vercel with MongoDB Atlas

This guide will help you deploy your application to Vercel while using MongoDB Atlas as your database.

## 1. MongoDB Atlas Connection

Your MongoDB Atlas connection string is already set up:
```
mongodb+srv://<santhosh-p>:<santhosh>@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b
```

This connection string has been configured in your `.env.production` file. If you need to make changes to the database connection:

1. **Access Your MongoDB Atlas Dashboard**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com) and log in.
   - Select your project and cluster.

2. **Modify Database Access** (if needed):
   - In the left sidebar, click "Database Access" to manage users.
   - You can modify the user `<santhosh-p>` or create additional users.

3. **Network Access**:
   - Ensure "Allow Access from Anywhere" (0.0.0.0/0) is enabled for Vercel to connect.

## 2. Prepare Your Project for Vercel

1. **Environment Variables**:
   - The `.env.production` file has been updated with your MongoDB Atlas connection string.
   - Make sure to set a secure `JWT_SECRET` for production.

2. **Verify Server Configuration**:
   - The server code has been configured to use the environment variables.
   - API routes are properly set up in the `vercel.json` file.

## 3. Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Push your code to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com) and sign up or log in.
3. Click "New Project" and import your repository.
4. Configure your project:
   - Set the Framework Preset to "Vite".
   - Add the following environment variables in the Vercel dashboard:
     - `MONGODB_URI`: Your MongoDB Atlas connection string (already set in .env.production)
     - `JWT_SECRET`: A secure random string
     - `JWT_EXPIRATION`: e.g., "1d"
     - `NODE_ENV`: "production"
   - Click "Deploy".

### Option B: Manual Upload via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```
   npm install -g vercel
   ```

2. **Login to Vercel** (if not already logged in):
   ```
   vercel login
   ```

3. **Navigate to your project directory**:
   ```
   cd path/to/b2b-code
   ```

4. **Deploy with environment variables**:
   ```
   vercel --prod --env MONGODB_URI="mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b" --env JWT_SECRET="your-secure-secret" --env JWT_EXPIRATION="1d" --env NODE_ENV="production"
   ```
   
   Alternatively, you can let Vercel prompt you for environment variables:
   ```
   vercel --prod
   ```

5. **Link to existing project** (if you've deployed before):
   ```
   vercel link
   ```
   Then deploy:
   ```
   vercel --prod
   ```

6. **Configure project settings** (if needed):
   ```
   vercel project add
   ```

7. **View deployment status**:
   ```
   vercel list
   ```

8. **Open deployed project**:
   ```
   vercel open
   ```

## 4. Verify Deployment

1. Once deployed, Vercel will provide you with a URL to access your application.
2. Test your application to ensure it's connecting to MongoDB Atlas correctly.
3. Check the Vercel logs if you encounter any issues.

## 5. Troubleshooting

- **Connection Issues**: If you encounter connection problems, verify:
  - The connection string format is correct
  - Username and password are properly URL-encoded
  - Network access is properly configured in MongoDB Atlas
- **Environment Variables**: Make sure all required environment variables are set in the Vercel dashboard.
- **Logs**: Check the Vercel logs for any errors or issues.

## 6. Production Considerations

- Set up proper authentication and authorization.
- Consider implementing database connection pooling for better performance.
- Set up monitoring and alerts for your MongoDB Atlas cluster.
- Regularly backup your database.
- Consider upgrading to a paid tier for production workloads with higher demands. 