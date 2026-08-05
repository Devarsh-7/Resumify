const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const Resume = require('../models/Resume');
const parseResume = require('../utils/parseResume');
const analyzeWithAI = require('../utils/analyzeWithAI');
const humanizeAI = require('../utils/humanizeAI');
const { sanitizeString } = require('../utils/sanitizeInput');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allowedExts = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file (PDF or DOCX)' });
    }

    const rawJobDesc = req.body.jobDescription || '';
    const jobDescription = sanitizeString(rawJobDesc);
    const isGeneral = !jobDescription || jobDescription.trim().length === 0;

    const resumeText = await parseResume(req.file.path);
    const aiResult = await analyzeWithAI(resumeText, jobDescription);

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

    Resume.findOneAndUpdate(
      { user: req.user._id, fileName: req.file.originalname },
      { resumeText: resumeText, createdAt: Date.now() },
      { upsert: true, new: true }
    ).catch(err => {
      console.error('Background Resume Vault sync error:', err.message);
    });

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

const getVault = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .select('-resumeText')
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume vault' });
  }
};

const deleteResume = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ message: 'Resume deleted from vault' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume' });
  }
};

const getHistory = async (req, res) => {
  try {
    const limit = Math.max(0, Math.min(100, parseInt(req.query.limit, 10) || 0));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;

    const total = await Analysis.countDocuments({ user: req.user._id });
    res.setHeader('X-Total-Count', total);
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');

    let query = Analysis.find({ user: req.user._id })
      .sort({ analyzedAt: -1 })
      .select('-jobDescription');

    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    const analyses = await query;
    res.json(analyses);
  } catch (error) {
    console.error('History fetch error:', error.message);
    res.status(500).json({ message: 'Failed to fetch analysis history' });
  }
};

const getAnalysis = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
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

const deleteAnalysis = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
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

const getResumeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume details' });
  }
};

const parseResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file (PDF or DOCX)' });
    }

    const resumeText = await parseResume(req.file.path);
    const resume = await Resume.findOneAndUpdate(
      { user: req.user._id, fileName: req.file.originalname },
      { resumeText: resumeText, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: 'Resume parsed and saved to vault successfully!',
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        resumeText: resume.resumeText,
        createdAt: resume.createdAt,
      }
    });
  } catch (error) {
    console.error('Resume parsing error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to parse resume' });
  }
};

const humanizeText = async (req, res) => {
  try {
    const rawText = req.body.text;
    const type = sanitizeString(req.body.type || '');
    const text = typeof rawText === 'string' ? sanitizeString(rawText) : '';

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ message: 'Please provide valid text of at least 20 characters.' });
    }

    const maxLimit = type === 'overall' ? 15000 : 5000;
    if (text.length > maxLimit) {
      return res.status(400).json({ message: `Text exceeds the ${maxLimit} character limit.` });
    }

    const result = await humanizeAI(text, type);
    res.json(result);
  } catch (error) {
    console.error('Humanizer controller error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to humanize text' });
  }
};

module.exports = {
  upload,
  analyzeResume,
  getHistory,
  getAnalysis,
  deleteAnalysis,
  getVault,
  deleteResume,
  getResumeById,
  parseResumeFile,
  humanizeText
};
