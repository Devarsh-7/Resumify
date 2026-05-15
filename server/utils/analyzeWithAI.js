const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the exact JSON structure we want back from Gemini for TARGETED analysis
const targetedSchema = {
  type: SchemaType.OBJECT,
  properties: {
    jobTitle: {
      type: SchemaType.STRING,
      description: 'The job title extracted from the job description',
    },
    atsScore: {
      type: SchemaType.NUMBER,
      description: 'ATS compatibility score from 0 to 100',
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of specific suggestions to improve the resume for this job',
    },
    missingSkills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Skills mentioned in the job description that are NOT found in the resume',
    },
    matchedSkills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Skills mentioned in the job description that ARE found in the resume',
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Strong points of the resume relevant to this job',
    },
  },
  required: ['jobTitle', 'atsScore', 'suggestions', 'missingSkills', 'matchedSkills', 'strengths'],
};

// Define the exact JSON structure we want back from Gemini for GENERAL ATS analysis
const generalSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: {
      type: SchemaType.NUMBER,
      description: 'General ATS compatibility score from 0 to 100',
    },
    ats_issues: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of strings highlighting ATS-unfriendly elements',
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of actionable improvements',
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Strong points of the resume',
    },
  },
  required: ['score', 'ats_issues', 'suggestions', 'strengths'],
};

/**
 * Analyze a resume against a job description or in general using Google Gemini AI
 * @param {string} resumeText - Extracted text from the resume
 * @param {string} [jobDescription] - Full job description text
 * @returns {Promise<Object>} - Analysis results
 */
const analyzeWithAI = async (resumeText, jobDescription) => {
  const isGeneral = !jobDescription || jobDescription.trim().length === 0;

  // Configure the model with structured JSON output
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: isGeneral ? generalSchema : targetedSchema,
      temperature: 0, // Consistent, deterministic results
    },
  });

  // Provide current date context so the AI doesn't incorrectly flag past dates as future
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let prompt = '';

  if (isGeneral) {
    prompt = `Your task is to analyze the uploaded resume for general ATS compatibility without requiring any job description.

**IMPORTANT: Today's date is ${currentDate}. Use this to correctly determine whether any dates mentioned in the resume are in the past or future. Do NOT flag dates that are before today as "future dates".**

## Evaluation Criteria:
- Resume formatting (avoid tables, columns, images, complex layouts)
- Section structure (presence of skills, projects, experience, education)
- Use of clear headings and standard sections
- Keyword usage (general industry-relevant terms)
- Clarity and readability
- Use of action verbs and measurable achievements

## Instructions:
1. Provide a score out of 100
2. Highlight ATS-unfriendly elements directly in "ats_issues"
3. Provide actionable suggestions in "suggestions"
4. Highlight strengths in "strengths"
5. Feedback should be concise, clear, and beginner-friendly

## RESUME:
${resumeText}`;
  } else {
    prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach.

**IMPORTANT: Today's date is ${currentDate}. Use this to correctly determine whether any dates mentioned in the resume are in the past or future. Do NOT flag dates that are before today as "future dates".**

Your task is to analyze the given resume against the provided job description and provide a detailed evaluation.

## SCORING CRITERIA (use these weights):
- **Keyword Match (30%)**: How well do the resume keywords match the job description requirements?
- **Skills Alignment (25%)**: How many required/preferred skills from the JD are present in the resume?
- **Experience Relevance (20%)**: How relevant is the candidate's experience to the role?
- **Education & Certifications (10%)**: Does the education/certification match JD requirements?
- **Resume Quality (15%)**: Is the resume well-structured, clear, and properly formatted?

## INSTRUCTIONS:
1. Extract the job title from the job description
2. Calculate an ATS score (0-100) based on the criteria above
3. Provide 4-6 specific, actionable suggestions to improve the resume for THIS specific job
4. List skills mentioned in the JD that are MISSING from the resume
5. List skills mentioned in the JD that ARE present in the resume
6. List 3-5 strengths of the resume relevant to this job

## JOB DESCRIPTION:
${jobDescription.trim()}

## RESUME:
${resumeText}

Analyze thoroughly and provide honest, helpful feedback.`;
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const analysis = JSON.parse(responseText);

    // Ensure atsScore is within valid range depending on the schema
    if (isGeneral) {
      analysis.score = Math.max(0, Math.min(100, Math.round(analysis.score)));
    } else {
      analysis.atsScore = Math.max(0, Math.min(100, Math.round(analysis.atsScore)));
    }

    return analysis;
  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    throw new Error('Failed to analyze resume with AI. Please try again.');
  }
};

module.exports = analyzeWithAI;
