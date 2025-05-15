const User = require('../models/UserModel');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      // Prevent admin from accidentally demoting the last admin or themselves if it's the only one?
      // Basic implementation for now.
      user.role = role;
      await user.save();
      res.json({ message: 'User role updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Set user's fingerprint verification status
// @route   PUT /api/admin/users/:id/verify-fingerprint
// @access  Private/Admin
const adminSetFingerprintVerified = async (req, res, next) => {
  const { isFingerprintVerified } = req.body; // Expecting { isFingerprintVerified: true/false }
  if (typeof isFingerprintVerified !== 'boolean') {
    return res.status(400).json({ message: 'isFingerprintVerified must be a boolean' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isFingerprintVerified = isFingerprintVerified;
      await user.save();
      res.json({ message: `User fingerprint verification status set to ${isFingerprintVerified}` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      // Add safety: prevent admin from deleting themselves? Or the last admin?
      // For now, direct deletion.
      // Consider what happens to content created by this user.
      await user.remove(); // or user.deleteOne() in newer Mongoose
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  adminSetFingerprintVerified,
  deleteUser,
};
