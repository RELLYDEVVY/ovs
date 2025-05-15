const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
    default: null,
  },
  // Votes count will be managed dynamically or in a separate results calculation
});

const ElectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
    default: null,
  },
  candidates: [CandidateSchema],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    // This will be set dynamically based on dates
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to set status before saving
ElectionSchema.pre('save', function (next) {
  const now = new Date();
  if (this.startDate > now) {
    this.status = 'upcoming';
  } else if (this.endDate < now) {
    this.status = 'ended';
  } else {
    this.status = 'ongoing';
  }
  next();
});

// Method to check if a user has voted in this election (to be used with Vote model)
// ElectionSchema.methods.userHasVoted = async function (userId) {
//   const vote = await mongoose.model('Vote').findOne({ electionId: this._id, userId });
//   return !!vote;
// };

module.exports = mongoose.model('Election', ElectionSchema); 