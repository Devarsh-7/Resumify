const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from a resume file (PDF or DOCX)
 * @param {string} filePath - Path to the uploaded file
 * @returns {Promise<string>} - Extracted text content
 */
const parseResume = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  try {
    let text = '';

    if (extension === '.pdf') {
      // Read PDF file and extract text
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (extension === '.docx') {
      // Read DOCX file and extract raw text
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else {
      throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }

    // Clean up: remove extra whitespace and blank lines
    text = text
      .replace(/\r\n/g, '\n')        // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')     // Max 2 consecutive newlines
      .replace(/[ \t]{2,}/g, ' ')     // Collapse multiple spaces/tabs
      .trim();

    if (!text || text.length < 50) {
      throw new Error('Could not extract enough text from the resume. The file might be image-based or empty.');
    }

    return text;
  } finally {
    // Always delete the uploaded file after processing
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting temp file:', err.message);
    }
  }
};

module.exports = parseResume;
