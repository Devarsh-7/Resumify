const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  upload,
  analyzeResume,
  getHistory,
  getAnalysis,
  deleteAnalysis,
  getVault,
  deleteResume,
} = require('../controllers/resumeController');

// All resume routes are protected (login required)
router.post('/analyze', protect, upload.single('resume'), analyzeResume);
router.get('/history', protect, getHistory);
router.get('/vault', protect, getVault);
router.get('/analysis/:id', protect, getAnalysis);
router.delete('/analysis/:id', protect, deleteAnalysis);
router.delete('/vault/:id', protect, deleteResume);

module.exports = router;
