const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Election',
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId, // We store the ID of the candidate within the Election's candidates array
    required: true,
    // Note: This refers to the _id of a candidate within the election.candidates sub-document array.
    // Validation that this candidateId exists in the specific election should be done at the application level.
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can vote only once per election
VoteSchema.index({ user: 1, election: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
