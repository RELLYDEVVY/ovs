const User = require('../models/UserModel');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Only allow 'admin' or 'user' roles
    if (req.body.role !== 'admin' && req.body.role !== 'user') {
      res.status(400);
      throw new Error('Invalid role');
    }
    
    user.role = req.body.role;
    const updatedUser = await user.save();
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    next(error);
  }
};

// @desc    Update user fingerprint verification status
// @route   PUT /api/users/:id/verify-fingerprint
// @access  Private/Admin
const updateUserFingerprintStatus = async (req, res, next) => {
  console.log(`[FP Update] Received for user ID: ${req.params.id}, with isFingerprintVerified: ${req.body.isFingerprintVerified}`);
  try {
    // Fetch without select for now to ensure all fields are available for save if needed, though it shouldn't matter for this.
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log(`[FP Update] User not found: ${req.params.id}`);
      res.status(404);
      return next(new Error('User not found')); // Ensure to return after sending response or calling next with error
    }
    console.log(`[FP Update] User found: ${user.username}, Current isFingerprintVerified: ${user.isFingerprintVerified}`);
    
    if (typeof req.body.isFingerprintVerified !== 'boolean') {
      console.log(`[FP Update] Invalid type for isFingerprintVerified: ${typeof req.body.isFingerprintVerified}`);
      res.status(400);
      return next(new Error('isFingerprintVerified must be a boolean'));
    }
    
    const newStatus = req.body.isFingerprintVerified;
    console.log(`[FP Update] Attempting to set isFingerprintVerified to: ${newStatus}`);
    user.isFingerprintVerified = newStatus;
    console.log(`[FP Update] User object after assignment (before save): isFingerprintVerified is now ${user.isFingerprintVerified}`);
    
    // Explicitly mark as modified if there are still issues, though direct assignment should handle this.
    // user.markModified('isFingerprintVerified');

    const updatedUser = await user.save();
    console.log(`[FP Update] User saved. New status in returned document: ${updatedUser.isFingerprintVerified}`);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('[FP Update] Error during fingerprint status update for user ID ' + req.params.id + ':', error);
    // Ensure that if next(error) is called, no other response is sent.
    // If error has a status, it's good practice for an error handler middleware to use it.
    if (!res.headersSent) {
      res.status(error.status || 500);
    }
    next(error);
  }
};

module.exports = { 
  getAllUsers,
  deleteUser,
  updateUserRole,
  updateUserFingerprintStatus 
};
