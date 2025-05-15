const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, markFingerprintVerified } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET api/auth/me
// @desc    Get user profile
// @access  Private
router.get('/me', protect, getUserProfile);

// @route   PUT api/auth/verify-fingerprint
// @desc    Mark current user as fingerprint verified
// @access  Private
router.put('/verify-fingerprint', protect, markFingerprintVerified);

// Test route (can be removed)
router.get('/test', (req, res) => res.json({ msg: 'Auth Route Works' }));

module.exports = router;
