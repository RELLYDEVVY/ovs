const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  deleteUser, 
  updateUserRole, 
  updateUserFingerprintStatus 
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, getAllUsers);

// @route   DELETE /api/users/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteUser);

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/:id/role', protect, admin, updateUserRole);

// @route   PUT /api/users/:id/verify-fingerprint
// @desc    Update user fingerprint verification status (Admin only)
// @access  Private/Admin
router.put('/:id/verify-fingerprint', protect, admin, updateUserFingerprintStatus);

module.exports = router;
