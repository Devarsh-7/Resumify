const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the exact JSON structure we want back from Gemini for humanizer analysis
const humanizeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    aiProbability: {
      type: SchemaType.NUMBER,
      description: 'The probability that the text is AI-generated, from 0 to 100',
    },
    linguisticAnalysis: {
      type: SchemaType.OBJECT,
      properties: {
        burstiness: {
          type: SchemaType.STRING,
          description: 'Linguistic description of sentence length variety. Humans vary length; AI is uniform.',
        },
        perplexity: {
          type: SchemaType.STRING,
          description: 'Linguistic description of vocabulary predictability and perplexity.',
        },
        repetitiveness: {
          type: SchemaType.STRING,
          description: 'Linguistic description of repetition of sentence structures.',
        },
      },
      required: ['burstiness', 'perplexity', 'repetitiveness'],
    },
    keyDifferentiators: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of 2-4 key features pointing to AI/human origin (e.g. passive voice, buzzword density)',
    },
    toneSuggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Actionable suggestions for adjusting the tone to sound authentic',
    },
    syntaxSuggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Actionable suggestions for altering sentence structures or patterns',
    },
    vocabularySuggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Actionable suggestions for replacing cliché buzzwords or AI markers',
    },
    humanizedText: {
      type: SchemaType.STRING,
      description: 'A completely rewritten version of the text that sounds human, professional, and authentic',
    },
    explanations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          originalPhrase: { type: SchemaType.STRING, description: 'The exact robotic or AI-like phrase from the input' },
          humanizedPhrase: { type: SchemaType.STRING, description: 'The improved human-like replacement' },
          reason: { type: SchemaType.STRING, description: 'Brief explanation of why this change improves authenticity' }
        },
        required: ['originalPhrase', 'humanizedPhrase', 'reason']
      },
      description: 'Key replacements done to humanize the text'
    }
  },
  required: [
    'aiProbability',
    'linguisticAnalysis',
    'keyDifferentiators',
    'toneSuggestions',
    'syntaxSuggestions',
    'vocabularySuggestions',
    'humanizedText',
    'explanations'
  ]
};

/**
 * Detect AI-generated text and suggest humanizing improvements
 * @param {string} text - The input text segment
 * @param {string} type - The optimization pathway: 'section' or 'overall'
 * @returns {Promise<Object>} - Detection and humanization results
 */
const humanizeAI = async (text, type = 'section') => {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for analysis.');
  }

  // Configure the model with structured JSON output
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: humanizeSchema,
      temperature: 0.2, // Slightly higher temperature to allow creative humanization while remaining professional
    },
  });

  const prompt = `You are an expert computational linguist and professional writing coach specializing in detecting and humanizing AI-generated content in professional documents (e.g. resumes, cover letters, and bios).

Analyze the following text to detect AI-generated content. Look for:
1. Low sentence length variance (low burstiness). AI sentences are often of uniform length and structure, whereas human writing naturally mixes short, punchy statements with longer complex sentences.
2. Low vocabulary perplexity. AI relies on predictable terms, transition phrases, and corporate clichés (e.g., "delve", "spearhead", "testament", "leverage", "robust", "foster", "tapestry", "demystify"). Humans use more varied, context-specific language.
3. Lack of direct, active voice (overuse of passive or nominalized constructions like "was responsible for the management of" instead of "managed").

Then, rewrite the text to make it sound highly human-like, professional, authentic, and compelling. Ensure the rewritten text preserves the exact original details, achievements, and technical data.

${type === 'overall' ? 'IMPORTANT: You are optimizing an entire resume. Please preserve the structure and layout (such as section headers, lists, and spacing) while applying humanization to the text content.' : 'IMPORTANT: You are optimizing a specific segment of a resume (such as a summary or a single bullet point/job description). Ensure the rewritten version is punchy, concise, and professional.'}

CRITICAL OUTPUT CONSTRAINTS:
- The "explanations" array must contain a MAXIMUM of 6 high-value replacement items representing the most meaningful adjustments to prevent response truncation.
- Each "originalPhrase" and "humanizedPhrase" MUST consist of at least 2 words (minimum 6 characters total) to prevent false matches or collisions during display.

Output your response matching the requested JSON schema exactly.

INPUT TEXT:
${text}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const analysis = JSON.parse(responseText);

    // Enforce limits and sanitize ranges
    analysis.aiProbability = Math.max(0, Math.min(100, Math.round(analysis.aiProbability)));

    return analysis;
  } catch (error) {
    console.error('Gemini AI Humanizer Error:', error.message);
    throw new Error('Failed to analyze and humanize text with AI. Please try again.');
  }
};

module.exports = humanizeAI;
