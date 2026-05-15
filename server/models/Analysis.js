const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    default: 'Not specified',
  },
  atsScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  suggestions: {
    type: [String],
    default: [],
  },
  missingSkills: {
    type: [String],
    default: [],
  },
  matchedSkills: {
    type: [String],
    default: [],
  },
  strengths: {
    type: [String],
    default: [],
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast per-user queries sorted by date (used by getHistory)
analysisSchema.index({ user: 1, analyzedAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
