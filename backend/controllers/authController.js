const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Utility to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    // Log the entire request body for debugging
    console.log('Register request body:', req.body);
    
    const { username, email, password, role, name } = req.body;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: { email: 'Email is required' } 
      });
    }
    
    if (!username) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: { username: 'Username is required' } 
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: { password: 'Password is required' } 
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      // Determine which field caused the duplicate
      const duplicateField = userExists.email === email ? 'email' : 'username';
      return res.status(400).json({ 
        message: 'User already exists', 
        errors: { [duplicateField]: `User already exists with this ${duplicateField}` } 
      });
    }
    
    // Create user with validated data
    const userData = {
      username,
      email,
      password, // Password will be hashed by the pre-save hook in UserModel
    };
    
    // Only add role if it's provided and valid
    if (role && ['user', 'admin'].includes(role)) {
      userData.role = role;
    }
    
    // Add name field if provided (this would require a schema update)
    if (name) {
      userData.name = name;
    }
    
    const user = await User.create(userData);
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isFingerprintVerified: user.isFingerprintVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration error details:', error);
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    // Find user by either username or email
    const user = await User.findOne({
      $or: [
        { username },
        { email: email || username } // Try username as email if email not provided
      ]
    });
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isFingerprintVerified: user.isFingerprintVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  // req.user is set by the 'protect' middleware
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    isFingerprintVerified: req.user.isFingerprintVerified,
  });
};

// @desc    Mark user as fingerprint verified (e.g., by an admin or a specific process)
// @route   PUT /api/auth/mark-fingerprint-verified/:userId (Admin only or specific logic)
// For simplicity, let's make it so a logged-in user can mark themselves verified for now.
// In a real app, this would be a more secure process, likely admin-driven.
// @route   PUT /api/auth/verify-fingerprint (User can do this for themselves)
// @access  Private
const markFingerprintVerified = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.isFingerprintVerified = true;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isFingerprintVerified: updatedUser.isFingerprintVerified,
        token: generateToken(updatedUser._id), // Re-issue token if claims changed, though not strictly needed here
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  markFingerprintVerified,
};
