const multer = require('multer');
const path = require('path');
const Analysis = require('../models/Analysis');
const Resume = require('../models/Resume');
const parseResume = require('../utils/parseResume');
const analyzeWithAI = require('../utils/analyzeWithAI');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Create unique filename: userId-timestamp-originalname
    const uniqueName = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filter: only allow PDF and DOCX files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// @desc    Analyze a resume against a job description
// @route   POST /api/resume/analyze
// @access  Private (login required)
const analyzeResume = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file (PDF or DOCX)' });
    }

    // Fetch optional job description
    const { jobDescription } = req.body;
    const isGeneral = !jobDescription || jobDescription.trim().length === 0;

    console.log(`📄 Processing resume: ${req.file.originalname}`);

    // Step 1: Extract text from the resume file
    const resumeText = await parseResume(req.file.path);
    console.log(`✅ Text extracted: ${resumeText.length} characters`);

    // Step 2: Analyze with Gemini AI
    console.log('🤖 Sending to Gemini AI for analysis...');
    const aiResult = await analyzeWithAI(resumeText, jobDescription);
    console.log(`✅ AI analysis complete. ATS Score: ${isGeneral ? aiResult.score : aiResult.atsScore}`);

    // Step 3: Save analysis to database
    const analysis = await Analysis.create({
      user: req.user._id,
      fileName: req.file.originalname,
      jobDescription: isGeneral ? 'General ATS Compatibility Check' : jobDescription.trim(),
      jobTitle: isGeneral ? 'General Analysis' : (aiResult.jobTitle || 'Not specified'),
      atsScore: isGeneral ? aiResult.score : aiResult.atsScore,
      suggestions: aiResult.suggestions || [],
      missingSkills: isGeneral ? aiResult.ats_issues : (aiResult.missingSkills || []),
      matchedSkills: isGeneral ? [] : (aiResult.matchedSkills || []),
      strengths: aiResult.strengths || [],
    });

    // Step 4: Sync to Resume Vault (Save the text for re-use)
    await Resume.findOneAndUpdate(
      { user: req.user._id, fileName: req.file.originalname },
      { resumeText: resumeText, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Step 5: Return the results
    res.status(201).json({
      message: 'Resume analyzed successfully!',
      analysis: {
        _id: analysis._id,
        fileName: analysis.fileName,
        jobTitle: analysis.jobTitle,
        atsScore: analysis.atsScore,
        suggestions: analysis.suggestions,
        missingSkills: analysis.missingSkills,
        matchedSkills: analysis.matchedSkills,
        strengths: analysis.strengths,
        analyzedAt: analysis.analyzedAt,
      },
    });
  } catch (error) {
    console.error('Resume analysis error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to analyze resume' });
  }
};

// @desc    Get all resumes in the vault for the logged-in user
// @route   GET /api/resume/vault
const getVault = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume vault' });
  }
};

// @desc    Delete a resume from the vault
// @route   DELETE /api/resume/vault/:id
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ message: 'Resume deleted from vault' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume' });
  }
};

// @desc    Get analysis history for the logged-in user
// @route   GET /api/resume/history
// @access  Private (login required)
const getHistory = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id })
      .sort({ analyzedAt: -1 }) // Newest first
      .select('-jobDescription'); // Don't send full JD text in list view

    res.json(analyses);
  } catch (error) {
    console.error('History fetch error:', error.message);
    res.status(500).json({ message: 'Failed to fetch analysis history' });
  }
};

// @desc    Get a single analysis by ID
// @route   GET /api/resume/analysis/:id
// @access  Private (login required)
const getAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id, // Ensure user can only access their own analyses
    });

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis fetch error:', error.message);
    res.status(500).json({ message: 'Failed to fetch analysis' });
  }
};

// @desc    Delete an analysis
// @route   DELETE /api/resume/analysis/:id
// @access  Private
const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ message: 'Failed to delete analysis' });
  }
};

module.exports = { upload, analyzeResume, getHistory, getAnalysis, deleteAnalysis, getVault, deleteResume };
