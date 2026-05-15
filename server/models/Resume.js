const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  resumeText: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast per-user vault queries + upsert by filename
resumeSchema.index({ user: 1, fileName: 1 }, { unique: true });

module.exports = mongoose.model('Resume', resumeSchema);
