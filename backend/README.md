# Online Voting System Backend

This is the backend server for the Online Voting System application.

## Deployment to Render

### Prerequisites

- A [Render](https://render.com/) account
- A MongoDB database (you can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Step 1: Push Your Code to GitHub

1. Create a new GitHub repository (if you haven't already)
2. Push your backend code to the repository

### Step 2: Create a New Web Service on Render

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: ovs-backend (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or select a paid plan if needed)

### Step 3: Set Environment Variables

In the Render dashboard, add the following environment variables:

- `NODE_ENV`: `production`
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your secret key for JWT token generation
- Any other environment variables your application needs

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Once deployed, you'll get a URL for your backend (e.g., `https://ovs-backend.onrender.com`)

### Step 5: Update Frontend Configuration

Update your frontend application to use the new backend URL.

## Local Development

1. Install dependencies: `npm install`
2. Create a `.env` file with the required environment variables
3. Start the development server: `npm run dev`

## Environment Variables

The following environment variables are required:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: (Optional) Port number for the server (defaults to 3001)
