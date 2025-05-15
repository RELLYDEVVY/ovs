const mongoose = require('mongoose');
const Election = require('../models/ElectionModel');
const Vote = require('../models/VoteModel');
const User = require('../models/UserModel'); // Now needed for fetching full user object for fingerprint template

// @desc    Create a new election
// @route   POST /api/elections
// @access  Private/Admin
const createElection = async (req, res, next) => {
  const {
    title,
    description,
    imageUrl,
    candidates, // Expected format: [{ name: "Cand1", description: "Desc1"}, ...]
    startDate,
    endDate,
  } = req.body;

  try {
    const election = new Election({
      title,
      description,
      imageUrl,
      candidates, // Mongoose will create _id for sub-documents
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    const createdElection = await election.save();
    res.status(201).json(createdElection);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all elections (with status filter and if user has voted)
// @route   GET /api/elections
// @access  Public (or Private if only logged-in users can see)
const getElections = async (req, res, next) => {
  const { status } = req.query; // e.g., /api/elections?status=ongoing
  const query = {};
  if (status && ['upcoming', 'ongoing', 'ended'].includes(status)) {
    query.status = status;
  }

  try {
    // Update status for all elections before fetching - this ensures status is current
    const elections = await Election.find({});
    const now = new Date();
    console.log(`Current server time: ${now.toISOString()}`);
    
    for (const el of elections) {
      let newStatus = el.status;
      console.log(`Election ${el.title}: startDate=${el.startDate.toISOString()}, endDate=${el.endDate.toISOString()}, current status=${el.status}`);
      
      if (el.startDate > now && el.status !== 'upcoming') {
        newStatus = 'upcoming';
        console.log(`Setting to upcoming: ${el.startDate.toISOString()} > ${now.toISOString()}`);
      }
      else if (el.endDate < now && el.status !== 'ended') {
        newStatus = 'ended';
        console.log(`Setting to ended: ${el.endDate.toISOString()} < ${now.toISOString()}`);
      }
      else if (el.startDate <= now && el.endDate >= now && el.status !== 'ongoing') {
        newStatus = 'ongoing';
        console.log(`Setting to ongoing: ${el.startDate.toISOString()} <= ${now.toISOString()} <= ${el.endDate.toISOString()}`);
      }

      if (newStatus !== el.status) {
        console.log(`Updating election ${el.title} status from ${el.status} to ${newStatus}`);
        el.status = newStatus;
        await el.save(); // Save if status changed
      }
    }

    const electionsWithVoteStatus = await Election.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // For each election, check if the current logged-in user (if any) has voted
    const results = [];
    for (const election of electionsWithVoteStatus) {
      let userHasVoted = false;
      if (req.user) {
        const vote = await Vote.findOne({ election: election._id, user: req.user._id });
        if (vote) userHasVoted = true;
      }
      results.push({
        ...election.toObject(), // Convert to plain object
        candidates: election.candidates.map((c) => ({ ...c.toObject(), id: c._id.toString() })), // Ensure candidate IDs are strings for frontend
        id: election._id.toString(), // Ensure election ID is a string
        userHasVoted,
      });
    }
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single election by ID (and if user has voted)
// @route   GET /api/elections/:id
// @access  Public (or Private)
const getElectionById = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id).populate('createdBy', 'username');
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    // Update status before returning
    const now = new Date();
    let newStatus = election.status;
    if (election.startDate > now && election.status !== 'upcoming') newStatus = 'upcoming';
    else if (election.endDate < now && election.status !== 'ended') newStatus = 'ended';
    else if (election.startDate <= now && election.endDate >= now && election.status !== 'ongoing')
      newStatus = 'ongoing';

    if (newStatus !== election.status) {
      election.status = newStatus;
      await election.save();
    }

    let userHasVoted = false;
    if (req.user) {
      const vote = await Vote.findOne({ election: election._id, user: req.user._id });
      if (vote) userHasVoted = true;
    }

    res.json({
      ...election.toObject(),
      candidates: election.candidates.map((c) => ({ ...c.toObject(), id: c._id.toString() })),
      id: election._id.toString(),
      userHasVoted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an election
// @route   PUT /api/elections/:id
// @access  Private/Admin
const updateElection = async (req, res, next) => {
  const { title, description, imageUrl, candidates, startDate, endDate } = req.body;
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Add checks here: e.g., cannot update 'ended' elections, or only certain fields.
    if (election.status === 'ended') {
      // return res.status(400).json({ message: 'Cannot update an ended election' });
    }

    election.title = title || election.title;
    election.description = description || election.description;
    election.imageUrl = imageUrl !== undefined ? imageUrl : election.imageUrl; // Allow setting to null
    election.startDate = startDate || election.startDate;
    election.endDate = endDate || election.endDate;

    // Candidate updates are more complex:
    // - Simple replacement: election.candidates = candidates || election.candidates;
    // - For more granular control (add/remove/update individual candidates), more logic is needed.
    // For now, let's assume a full replacement if candidates array is provided.
    if (candidates) {
      election.candidates = candidates.map((c) => ({
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        _id: c.id || new mongoose.Types.ObjectId(),
      }));
    }

    const updatedElection = await election.save(); // .pre('save') hook will update status
    res.json({
      ...updatedElection.toObject(),
      candidates: updatedElection.candidates.map((c) => ({ ...c.toObject(), id: c._id.toString() })),
      id: updatedElection._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
const deleteElection = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Add checks: e.g., cannot delete 'ongoing' or 'ended' elections with votes.
    // For now, simple deletion.
    // Also, delete associated votes for this election
    await Vote.deleteMany({ election: election._id });
    await election.deleteOne();  // Using deleteOne() instead of deprecated remove()

    res.json({ message: 'Election removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cast a vote in an election
// @route   POST /api/elections/:electionId/vote
// @access  Private (User role, fingerprint verified)
const castVote = async (req, res, next) => {
  const { candidateId, fingerprintData } = req.body;
  const { electionId } = req.params;
  let userId = req.user._id;

  // Get the full user object to check/update fingerprint status
  const user = await User.findById(userId);
  if (!user) {
    // This case should ideally not happen if req.user is valid from auth middleware
    return res.status(404).json({ message: 'User not found.' });
  }

  if (!user.isFingerprintVerified) {
    if (!fingerprintData) {
      return res.status(400).json({ message: 'Fingerprint data required for unverified users.' });
    }
    if (!user.fingerprintTemplate) {
      return res.status(400).json({ message: 'Fingerprint not enrolled for this user. Please enroll fingerprint first.' });
    }
    // Simulate fingerprint verification (replace with actual verification logic)
    // For testing, assume fingerprintData is the template string itself
    if (fingerprintData !== user.fingerprintTemplate) {
      return res.status(401).json({ message: 'Fingerprint verification failed.' });
    }
    // If verification is successful, mark user as verified
    user.isFingerprintVerified = true;
    await user.save();
    // req.user from middleware might be stale, so ensure we reflect the change if it's used below.
    // However, for vote creation, we are using userId directly.
  }

  try {
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    if (election.status !== 'ongoing') {
      return res.status(400).json({ message: `Election is not ongoing. Status: ${election.status}` });
    }

    // Check if the candidate exists within this election
    const candidateExists = election.candidates.find((c) => c._id.toString() === candidateId);
    if (!candidateExists) {
      return res.status(404).json({ message: 'Candidate not found in this election' });
    }

    // Vote.create will fail if unique index (user, election) is violated
    const vote = await Vote.create({
      user: userId, // Use userId obtained at the beginning
      election: electionId,
      candidate: candidateId, // This is the _id of the candidate sub-document
    });

    res.status(201).json(vote);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error for unique index
      return res.status(400).json({ message: 'You have already voted in this election.' });
    }
    next(error);
  }
};

// @desc    Get election results
// @route   GET /api/elections/:electionId/results
// @access  Public (after election has ended)
const getElectionResults = async (req, res, next) => {
  const { electionId } = req.params;
  try {
    const election = await Election.findById(electionId).populate('createdBy', 'username');
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Optionally, restrict results visibility until election has ended
    // if (election.status !== 'ended') {
    //   return res.status(400).json({ message: 'Election results are not yet available.' });
    // }

    const votes = await Vote.find({ election: electionId });
    const results = election.candidates.map((candidate) => {
      const voteCount = votes.filter((vote) => vote.candidate.toString() === candidate._id.toString()).length;
      return {
        ...candidate.toObject(), // Spread candidate details
        id: candidate._id.toString(),
        votes: voteCount,
      };
    });

    res.json({
      title: election.title,
      description: election.description,
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status,
      candidates: results,
      totalVotes: votes.length,
      createdBy: election.createdBy,
      id: election._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  castVote,
  getElectionResults,
};
