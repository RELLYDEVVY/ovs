const express = require('express');
const router = express.Router();
const {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  castVote,
  getElectionResults,
} = require('../controllers/electionController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET api/elections/test
// @desc    Tests elections route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Elections Route Works' }));

// CRUD for Elections
router
  .route('/')
  .post(protect, admin, createElection) // Admin creates election
  .get(protect, getElections); // Logged-in users can get all elections (protect is optional here, could be public)
// Making it protected to pass req.user for hasVoted logic easily

router
  .route('/:id')
  .get(protect, getElectionById) // Logged-in users get election by ID (again, for hasVoted)
  .put(protect, admin, updateElection) // Admin updates election
  .delete(protect, admin, deleteElection); // Admin deletes election

// Voting
router.post('/:electionId/vote', protect, castVote); // User casts a vote (fingerprint check in controller)

// Results
router.get('/:electionId/results', protect, getElectionResults); // Logged-in users can get results (protect is optional)

module.exports = router;
