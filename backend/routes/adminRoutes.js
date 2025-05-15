const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  adminSetFingerprintVerified,
  deleteUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin privileges
router.use(protect);
router.use(admin);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/users/:id', getUserById);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', updateUserRole);

// @route   PUT /api/admin/users/:id/verify-fingerprint
// @desc    Admin sets user fingerprint verification status
// @access  Private/Admin
router.put('/users/:id/verify-fingerprint', adminSetFingerprintVerified);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', deleteUser);

module.exports = router;
