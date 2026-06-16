
// ── Color palette ──────────────────────────────────────────────────────
const COLORS = {
  primary:    [37, 99, 235],   // Blue-600
  primaryBg:  [239, 246, 255], // Blue-50
  green:      [22, 163, 74],   // Green-600
  greenBg:    [240, 253, 244], // Green-50
  red:        [220, 38, 38],   // Red-600
  redBg:      [254, 242, 242], // Red-50
  dark:       [15, 23, 42],    // Slate-900
  text:       [51, 65, 85],    // Slate-700
  subtext:    [100, 116, 139], // Slate-500
  light:      [148, 163, 184], // Slate-400
  border:     [226, 232, 240], // Slate-200
  white:      [255, 255, 255],
  sectionBg:  [248, 250, 252], // Slate-50
};

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Wraps text to fit within maxWidth. Returns an array of lines.
 */
function wrapText(pdf, text, maxWidth) {
  if (!text) return [''];
  return pdf.splitTextToSize(String(text), maxWidth);
}

/**
 * Ensures enough vertical space for the next block, adds a page if needed.
 * Returns the (possibly reset) y position.
 */
function ensureSpace(pdf, y, needed, pageHeight, marginBottom, marginTop) {
  if (y + needed > pageHeight - marginBottom) {
    pdf.addPage();
    return marginTop;
  }
  return y;
}

/**
 * Draws a rounded rectangle (filled).
 */
function roundedRect(pdf, x, y, w, h, r, fillColor) {
  pdf.setFillColor(...fillColor);
  pdf.roundedRect(x, y, w, h, r, r, 'F');
}

/**
 * Draws a pill-shaped tag.
 */
function drawPill(pdf, x, y, text, bgColor, textColor, fontSize = 7) {
  pdf.setFontSize(fontSize);
  const tw = pdf.getTextWidth(text) + 5;
  const th = fontSize * 0.5 + 3;
  roundedRect(pdf, x, y, tw, th, th / 2, bgColor);
  pdf.setTextColor(...textColor);
  pdf.text(text, x + 2.5, y + th - 1.5);
  return tw + 2; // return width consumed (with gap)
}

// ── Main export ────────────────────────────────────────────────────────

/**
 * Generates a professional, text-based PDF report from analysis data.
 * @param {string} _elementId - Legacy parameter (unused, kept for API compat).
 * @param {Object} metadata - { score, fileName, analysis }
 */
export const generatePDFReport = async (_elementId, metadata = {}) => {
  const analysis = metadata.analysis;
  if (!analysis) {
    console.error('No analysis data provided to PDF generator.');
    return;
  }

  // Dynamically import jsPDF only when this function is called
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // ── Page constants ─────────────────────────────────────────────────
  const PAGE_W = pdf.internal.pageSize.getWidth();   // 210
  const PAGE_H = pdf.internal.pageSize.getHeight();  // 297
  const ML = 18;       // margin left
  const MR = 18;       // margin right
  const MT = 20;       // margin top (first page has header, so used on subsequent pages)
  const MB = 20;       // margin bottom
  const CW = PAGE_W - ML - MR; // content width

  let y = 0;

  // ────────────────────────────────────────────────────────────────────
  // HEADER BAR
  // ────────────────────────────────────────────────────────────────────
  roundedRect(pdf, 0, 0, PAGE_W, 38, 0, COLORS.primary);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...COLORS.white);
  pdf.text('Resumify AI', ML, 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(200, 220, 255);
  pdf.text('Expert Analysis Report', ML, 23);

  // Right side – date & file
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.white);
  pdf.text(reportDate, PAGE_W - MR, 14, { align: 'right' });

  pdf.setFontSize(7);
  pdf.setTextColor(200, 220, 255);
  const truncatedName = (analysis.fileName || 'Resume').substring(0, 40);
  pdf.text(truncatedName, PAGE_W - MR, 20, { align: 'right' });

  // Thin accent line under header
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(0.6);
  pdf.line(0, 38, PAGE_W, 38);

  y = 50;

  // ────────────────────────────────────────────────────────────────────
  // SCORE SECTION
  // ────────────────────────────────────────────────────────────────────
  const score = analysis.atsScore ?? 0;
  const isGeneral = analysis.jobTitle === 'General Analysis';

  // Score card background
  roundedRect(pdf, ML, y, CW, 40, 4, COLORS.sectionBg);
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(ML, y, CW, 40, 4, 4, 'S');

  // Large score number
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(42);
  pdf.setTextColor(...COLORS.primary);
  pdf.text(`${score}`, ML + 14, y + 27);

  // "/ 100  ATS Score"
  const scoreNumWidth = pdf.getTextWidth(`${score}`);
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.light);
  pdf.text('/ 100', ML + 14 + scoreNumWidth + 2, y + 27);

  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.subtext);
  pdf.text('ATS Compatibility Score', ML + 14, y + 34);

  // Right side of score card: status indicator
  const statusLabel = score >= 80 ? 'Interview Ready' : score >= 50 ? 'Needs Optimization' : 'Significant Gaps';
  const statusColor = score >= 80 ? COLORS.green : score >= 50 ? [202, 138, 4] : COLORS.red;
  const statusBg = score >= 80 ? COLORS.greenBg : score >= 50 ? [254, 252, 232] : COLORS.redBg;

  // Draw status badge
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  const statusTextWidth = pdf.getTextWidth(statusLabel) + 10;
  const statusX = PAGE_W - MR - 8 - statusTextWidth;
  const statusY = y + 8;
  roundedRect(pdf, statusX, statusY, statusTextWidth, 8, 4, statusBg);
  // Small colored dot
  pdf.setFillColor(...statusColor);
  pdf.circle(statusX + 4.5, statusY + 4, 1.5, 'F');
  // Label text
  pdf.setTextColor(...statusColor);
  pdf.text(statusLabel, statusX + 8, statusY + 5.5);

  if (!isGeneral) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.subtext);
    pdf.text(`Targeting: ${analysis.jobTitle || 'Open Role'}`, PAGE_W - MR - 8, y + 22, { align: 'right' });
  }

  y += 50;

  // ────────────────────────────────────────────────────────────────────
  // SECTION HELPER
  // ────────────────────────────────────────────────────────────────────
  function sectionTitle(title, accentColor = COLORS.primary) {
    y = ensureSpace(pdf, y, 16, PAGE_H, MB, MT);
    // Accent bar
    pdf.setFillColor(...accentColor);
    pdf.rect(ML, y, 3, 8, 'F');
    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...COLORS.dark);
    pdf.text(title, ML + 7, y + 6);
    // Underline
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.15);
    pdf.line(ML, y + 10, PAGE_W - MR, y + 10);
    y += 16;
  }

  // ────────────────────────────────────────────────────────────────────
  // MATCHED SKILLS (targeted only)
  // ────────────────────────────────────────────────────────────────────
  if (!isGeneral && analysis.matchedSkills?.length > 0) {
    sectionTitle('Matched Skills', COLORS.green);

    let pillX = ML;
    analysis.matchedSkills.forEach((skill) => {
      const pillFontSize = 7.5;
      pdf.setFontSize(pillFontSize);
      const tw = pdf.getTextWidth(skill) + 6;
      if (pillX + tw > PAGE_W - MR) {
        pillX = ML;
        y += 7;
        y = ensureSpace(pdf, y, 8, PAGE_H, MB, MT);
      }
      pillX += drawPill(pdf, pillX, y, skill, COLORS.greenBg, COLORS.green, pillFontSize);
    });
    y += 12;
  }

  // --------------------------------------------------------------------
  // MISSING SKILLS / ATS ISSUES
  // --------------------------------------------------------------------
  if (analysis.missingSkills?.length > 0) {
    const titleText = isGeneral ? 'ATS Issues and Formatting' : 'Gap Analysis - Missing Skills';
    sectionTitle(titleText, COLORS.red);
    
    let pillX = ML;
    analysis.missingSkills.forEach((skill) => {
      const pillFontSize = 7.5;
      pdf.setFontSize(pillFontSize);
      const tw = pdf.getTextWidth(skill) + 6;
      if (pillX + tw > PAGE_W - MR) {
        pillX = ML;
        y += 7;
        y = ensureSpace(pdf, y, 8, PAGE_H, MB, MT);
      }
      pillX += drawPill(pdf, pillX, y, skill, COLORS.redBg, COLORS.red, pillFontSize);
    });
    y += 12;
  }

  // ────────────────────────────────────────────────────────────────────
  // STRENGTHS
  // ────────────────────────────────────────────────────────────────────
  if (analysis.strengths?.length > 0) {
    sectionTitle('Key Strengths', COLORS.green);

    analysis.strengths.forEach((str, idx) => {
      const lines = wrapText(pdf, `${idx + 1}. ${str}`, CW - 8);
      const blockH = lines.length * 5 + 3;
      y = ensureSpace(pdf, y, blockH, PAGE_H, MB, MT);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.text);
      lines.forEach((line) => {
        pdf.text(line, ML + 4, y);
        y += 4.5;
      });
      y += 2;
    });
    y += 4;
  }

  // ────────────────────────────────────────────────────────────────────
  // AI SUGGESTIONS
  // ────────────────────────────────────────────────────────────────────
  if (analysis.suggestions?.length > 0) {
    sectionTitle('AI Recommendations', COLORS.primary);

    analysis.suggestions.forEach((suggestion, idx) => {
      const lines = wrapText(pdf, suggestion, CW - 16);
      const blockH = lines.length * 5 + 10;
      y = ensureSpace(pdf, y, blockH, PAGE_H, MB, MT);

      // Numbered circle
      roundedRect(pdf, ML, y - 1, 7, 7, 3.5, COLORS.primaryBg);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.primary);
      pdf.text(`${idx + 1}`, ML + 2.4, y + 3.8);

      // Suggestion text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.text);
      lines.forEach((line, lineIdx) => {
        pdf.text(line, ML + 12, y + 1 + (lineIdx * 4.5));
      });
      y += lines.length * 4.5 + 6;
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // FOOTER
  // ────────────────────────────────────────────────────────────────────
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // Footer line
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.15);
    pdf.line(ML, PAGE_H - 12, PAGE_W - MR, PAGE_H - 12);

    // Footer text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.light);
    pdf.text('Generated by Resumify AI - AI-Powered Resume Analysis', ML, PAGE_H - 8);
    pdf.text(`Page ${i} of ${totalPages}`, PAGE_W - MR, PAGE_H - 8, { align: 'right' });
  }

  // ── Save ───────────────────────────────────────────────────────────
  const safeScore = score || 'Analysis';
  const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
  pdf.save(`Resumify_Report_${safeScore}_${dateStr}.pdf`);

  return true;
};
