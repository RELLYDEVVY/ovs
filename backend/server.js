const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const connectDB = require('./config/db'); // Import DB connection

const app = express();
const port = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // This should handle preflight and set permissive CORS headers
app.use(express.json()); // To parse JSON bodies

// API Routes
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Election routes
const electionRoutes = require('./routes/electionRoutes');
app.use('/api/elections', electionRoutes);

// Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// User routes (for fetching all users by admin)
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Original Hello World - can be removed or kept for basic check
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error handling middleware - Should be defined AFTER all routes
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = {};
    
    // Extract all validation error messages
    Object.keys(err.errors).forEach(key => {
      validationErrors[key] = err.errors[key].message;
    });
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: validationErrors,
      error: err.message
    });
  }
  
  // Handle duplicate key errors (e.g., unique constraint violations)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `Duplicate value for ${field}`,
      error: `A record with this ${field} already exists`
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong on the server!',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    error: err
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`CORS enabled for all origins via cors() package.`);
});
