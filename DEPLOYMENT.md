# Deployment Guide

This guide will help you deploy the RAM File Share application to GitHub and Render.

## Deploying to GitHub

1. Create a new repository on GitHub:
   - Go to [GitHub](https://github.com) and sign in
   - Click on the "+" icon in the top right corner and select "New repository"
   - Name your repository (e.g., "ram-file-share")
   - Choose public or private visibility
   - Click "Create repository"

2. Initialize your local repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ram-file-share.git
   git push -u origin main
   ```

## Deploying to Render

1. Sign up for a Render account:
   - Go to [Render](https://render.com) and sign up
   - Connect your GitHub account

2. Deploy using the render.yaml file:
   - In your Render dashboard, click "New" and select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the render.yaml file and deploy both services

3. Manual deployment (if needed):
   - For the backend API:
     - Click "New" and select "Web Service"
     - Connect your GitHub repository
     - Set the name to "ram-file-share-api"
     - Set the environment to "Node"
     - Set the build command to `npm install`
     - Set the start command to `npm start`
     - Add environment variables:
       - PORT: 3001
       - NODE_ENV: production
     - Click "Create Web Service"

   - For the frontend:
     - Click "New" and select "Static Site"
     - Connect your GitHub repository
     - Set the name to "ram-file-share-client"
     - Set the build command to `cd client && npm install && npm run build`
     - Set the publish directory to `client/build`
     - Add environment variables:
       - REACT_APP_API_URL: https://ram-file-share-api.onrender.com
     - Click "Create Static Site"

## Accessing Your Deployed Application

Once deployed, your application will be available at:
- Frontend: https://ram-file-share-client.onrender.com
- Backend API: https://ram-file-share-api.onrender.com

## Troubleshooting

- If you encounter CORS issues, make sure the backend is properly configured to accept requests from the frontend domain.
- If the WebSocket connection fails, check that the REACT_APP_API_URL environment variable is correctly set.
- For any other issues, check the Render logs in the dashboard. 