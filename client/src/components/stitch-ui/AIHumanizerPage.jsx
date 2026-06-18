import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import api from '../../api/axiosConfig';

const AIHumanizerPage = () => {
  const [text, setText] = useState('');
  const [originalSubmittedText, setOriginalSubmittedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('tone');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // New States for Multi-Source import and Pathway Optimization
  const [importSource, setImportSource] = useState('paste'); // 'paste', 'upload', 'vault'
  const [optimizationType, setOptimizationType] = useState('section'); // 'section', 'overall'
  const [vaultResumes, setVaultResumes] = useState([]);
  const [selectedVaultResumeId, setSelectedVaultResumeId] = useState('');
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Sync scroll references and lock flags to avoid infinite scroll feedback loops
  const leftSheetRef = useRef(null);
  const rightSheetRef = useRef(null);
  const isSyncingLeftScroll = useRef(false);
  const isSyncingRightScroll = useRef(false);

  const handleLeftScroll = () => {
    if (isSyncingLeftScroll.current) {
      isSyncingLeftScroll.current = false;
      return;
    }
    if (leftSheetRef.current && rightSheetRef.current) {
      const left = leftSheetRef.current;
      const right = rightSheetRef.current;

      const leftMaxScroll = left.scrollHeight - left.clientHeight;
      const rightMaxScroll = right.scrollHeight - right.clientHeight;

      if (leftMaxScroll > 0 && rightMaxScroll > 0) {
        const percentage = left.scrollTop / leftMaxScroll;
        isSyncingRightScroll.current = true;
        right.scrollTop = Math.round(percentage * rightMaxScroll);
      }
    }
  };

  const handleRightScroll = () => {
    if (isSyncingRightScroll.current) {
      isSyncingRightScroll.current = false;
      return;
    }
    if (leftSheetRef.current && rightSheetRef.current) {
      const left = leftSheetRef.current;
      const right = rightSheetRef.current;

      const leftMaxScroll = left.scrollHeight - left.clientHeight;
      const rightMaxScroll = right.scrollHeight - right.clientHeight;

      if (leftMaxScroll > 0 && rightMaxScroll > 0) {
        const percentage = right.scrollTop / rightMaxScroll;
        isSyncingLeftScroll.current = true;
        left.scrollTop = Math.round(percentage * leftMaxScroll);
      }
    }
  };

  useEffect(() => {
    if (importSource === 'vault') {
      const fetchVault = async () => {
        try {
          const res = await api.get('/resume/vault');
          setVaultResumes(res.data);
        } catch (err) {
          console.error('Failed to fetch vault resumes:', err);
        }
      };
      fetchVault();
    }
  }, [importSource]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadAndParseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndParseFile(e.target.files[0]);
    }
  };

  const uploadAndParseFile = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    setParsing(true);
    setError('');
    try {
      const res = await api.post('/resume/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText(res.data.resume.resumeText);
      // Auto select overall optimization on file import
      setOptimizationType('overall');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse file. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleVaultResumeSelect = async (e) => {
    const resumeId = e.target.value;
    setSelectedVaultResumeId(resumeId);
    if (!resumeId) return;

    setParsing(true);
    setError('');
    try {
      const res = await api.get(`/resume/vault/${resumeId}`);
      setText(res.data.resumeText);
      // Auto select overall optimization on vault import
      setOptimizationType('overall');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch resume text from vault.');
    } finally {
      setParsing(false);
    }
  };

  const handleHumanize = async () => {
    const limit = optimizationType === 'overall' ? 15000 : 5000;
    if (!text || text.trim().length < 20) {
      setError('Please provide text of at least 20 characters.');
      return;
    }
    if (text.length > limit) {
      setError(`Text exceeds the ${limit} character limit.`);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setOriginalSubmittedText(text);

    try {
      const res = await api.post('/resume/humanize', { text, type: optimizationType });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fuzzy match finder ignoring case, whitespace, newlines, and punctuation variations
  const findFuzzyMatch = (fullText, searchPhrase) => {
    if (!fullText || !searchPhrase) return null;

    // Fast-path: check exact match first
    let exactIdx = fullText.indexOf(searchPhrase);
    if (exactIdx !== -1) {
      return { start: exactIdx, end: exactIdx + searchPhrase.length };
    }

    // Slow-path: map character indices to alphanumeric-only representation
    const cleanSearch = searchPhrase.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanSearch.length < 4) return null; // Too short to safely match fuzzily without collision risks

    // Build the mapped array: index in clean string -> index in original fullText string
    const originalIndices = [];
    let cleanText = '';
    for (let i = 0; i < fullText.length; i++) {
      const char = fullText[i];
      if (/[a-zA-Z0-9]/.test(char)) {
        cleanText += char.toLowerCase();
        originalIndices.push(i);
      }
    }

    // Search inside cleanText
    const cleanIdx = cleanText.indexOf(cleanSearch);
    if (cleanIdx !== -1) {
      const startOrig = originalIndices[cleanIdx];
      const endOrig = originalIndices[cleanIdx + cleanSearch.length - 1] + 1;
      return { start: startOrig, end: endOrig };
    }

    return null;
  };

  // Robust non-overlapping phrase highlighting function
  const highlightText = (fullText, explanations, mode) => {
    if (!fullText) return '';
    
    // Preprocess explanations to split multi-line phrases
    const flatExplanations = [];
    if (explanations && explanations.length > 0) {
      explanations.forEach((exp) => {
        const originalLines = (exp.originalPhrase || '').split('\n');
        const humanizedLines = (exp.humanizedPhrase || '').split('\n');
        
        if (originalLines.length === humanizedLines.length) {
          originalLines.forEach((origLine, idx) => {
            const humLine = humanizedLines[idx];
            if (origLine.trim() && humLine && humLine.trim()) {
              flatExplanations.push({
                originalPhrase: origLine.trim(),
                humanizedPhrase: humLine.trim(),
                reason: exp.reason,
              });
            }
          });
        } else {
          originalLines.forEach((origLine) => {
            if (origLine.trim()) {
              flatExplanations.push({
                originalPhrase: origLine.trim(),
                humanizedPhrase: '',
                reason: exp.reason,
              });
            }
          });
          humanizedLines.forEach((humLine) => {
            if (humLine.trim()) {
              flatExplanations.push({
                originalPhrase: '',
                humanizedPhrase: humLine.trim(),
                reason: exp.reason,
              });
            }
          });
        }
      });
    }

    const lines = fullText.split('\n');

    return lines.map((line, lineIdx) => {
      if (!line) return <br key={`br-${lineIdx}`} />;

      const isOriginal = mode === 'original';
      // Match list items preserving indentation level
      const listMatch = line.match(/^(\s*)([*\-•]|\d+\.)\s+(.*)/);
      
      let lineTextToHighlight = line;
      let isListItem = false;
      let marker = '';
      let listContent = '';
      let indentSpaces = 0;

      if (listMatch) {
        isListItem = true;
        indentSpaces = listMatch[1].length;
        marker = listMatch[2];
        listContent = listMatch[3];
        lineTextToHighlight = listContent;
      }

      // Find matches for this specific line/segment
      const matches = [];
      if (flatExplanations && flatExplanations.length > 0) {
        flatExplanations.forEach((exp) => {
          const searchPhrase = isOriginal ? exp.originalPhrase : exp.humanizedPhrase;
          if (!searchPhrase || searchPhrase.trim().length < 3) return;

          const match = findFuzzyMatch(lineTextToHighlight, searchPhrase);
          if (match) {
            matches.push({
              start: match.start,
              end: match.end,
              phrase: lineTextToHighlight.substring(match.start, match.end),
              exp: exp,
            });
          }
        });

        // Sort by start index ascending, longer first
        matches.sort((a, b) => {
          if (a.start === b.start) return b.end - a.end;
          return a.start - b.start;
        });
      }

      // Filter overlapping matches
      const nonOverlapping = [];
      let lastEnd = 0;
      for (const match of matches) {
        if (match.start >= lastEnd) {
          nonOverlapping.push(match);
          lastEnd = match.end;
        }
      }

      // Build elements for this line
      const lineElements = [];
      let lastIdx = 0;

      nonOverlapping.forEach((match, idx) => {
        if (match.start > lastIdx) {
          lineElements.push(lineTextToHighlight.substring(lastIdx, match.start));
        }

        const tooltip = isOriginal 
          ? `Robotic Pattern: "${match.phrase}"\nReason: ${match.exp.reason}` 
          : `Optimized Choice: "${match.phrase}"\nOriginal was: "${match.exp.originalPhrase}"`;
        
        const highlightClass = isOriginal
          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-b border-red-500/30 px-1 rounded cursor-help font-semibold hover:bg-red-500/20 transition-all duration-200"
          : "bg-green-500/10 text-green-600 dark:text-green-400 border-b border-green-500/30 px-1 rounded cursor-help font-semibold hover:bg-green-500/20 transition-all duration-200";

        lineElements.push(
          <span
            key={`hl-${lineIdx}-${idx}`}
            className={highlightClass}
            title={tooltip}
          >
            {match.phrase}
          </span>
        );
        lastIdx = match.end;
      });

      if (lastIdx < lineTextToHighlight.length) {
        lineElements.push(lineTextToHighlight.substring(lastIdx));
      }

      // Render line markup
      if (isListItem) {
        const paddingLeft = 24 + indentSpaces * 8;
        const markerLeft = indentSpaces * 8 + 4;
        return (
          <div 
            key={`line-${lineIdx}`} 
            className="relative text-left select-text mb-1 flex items-start"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <span 
              className="absolute font-bold text-blue-600 dark:text-blue-400 shrink-0"
              style={{ left: `${markerLeft}px` }}
            >
              {marker}
            </span>
            <span className="flex-1">{lineElements}</span>
          </div>
        );
      } else {
        return (
          <div key={`line-${lineIdx}`} className="min-h-[1.5rem] mb-1 select-text">
            {lineElements.length > 0 ? lineElements : '\u00A0'}
          </div>
        );
      }
    });
  };

  const maxCharLimit = optimizationType === 'overall' ? 15000 : 5000;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-manrope transition-colors duration-300">
      <Navbar isLoggedIn={true} />
      <Sidebar activeTab="AI Humanizer" />

      <main className="flex-1 ml-64 pt-24 p-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">
                AI Content <span className="text-blue-600 italic">Humanizer</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 transition-colors max-w-2xl">
                Detect AI-generated patterns and optimize your resume text to sound natural, active, and authentic. Give your professional story a soul.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                title="Toggle Theme"
              >
                <span className="material-symbols-rounded">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              </button>
            </div>
          </header>

          {/* Input Area */}
          <section className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-700 transition-colors">
            {/* Step 1: Upload / Import Resume */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 material-symbols-rounded">edit_note</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">1. Import or Paste Resume</h3>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-colors">
                <button
                  type="button"
                  disabled={parsing || loading}
                  onClick={() => setImportSource('paste')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none ${importSource === 'paste' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <span className="material-symbols-rounded text-sm">edit_note</span>
                  Paste Text
                </button>
                <button
                  type="button"
                  disabled={parsing || loading}
                  onClick={() => setImportSource('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none ${importSource === 'upload' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <span className="material-symbols-rounded text-sm">cloud_upload</span>
                  Upload File
                </button>
                <button
                  type="button"
                  disabled={parsing || loading}
                  onClick={() => setImportSource('vault')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none ${importSource === 'vault' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <span className="material-symbols-rounded text-sm">folder_open</span>
                  Import Vault
                </button>
              </div>
            </div>

            {importSource === 'upload' && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <label
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`block border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-inner'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/30'
                  } ${parsing || loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input type="file" disabled={parsing || loading} className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all ${dragActive ? 'bg-blue-600 text-white scale-110' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                    <span className="material-symbols-rounded text-2xl">{parsing ? 'hourglass_top' : dragActive ? 'download' : 'cloud_upload'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{parsing ? 'Parsing document...' : 'Drag & Drop Resume File'}</h4>
                  <p className="text-xs text-slate-500 mb-3">PDF or DOCX (max 5MB)</p>
                  <div className="px-4 py-1.5 font-bold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs inline-block">
                    {parsing ? 'Extracting Text...' : 'Browse File'}
                  </div>
                </label>
              </div>
            )}

            {importSource === 'vault' && (
              <div className="mb-6 space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Select saved resume</label>
                {vaultResumes.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center text-xs text-slate-500 border border-slate-100 dark:border-slate-800">
                    No resumes found in the vault. Try uploading one under "Upload File" first!
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedVaultResumeId}
                      disabled={parsing || loading}
                      onChange={handleVaultResumeSelect}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm transition-colors cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Choose from vault --</option>
                      {vaultResumes.map((resume) => (
                        <option key={resume._id} value={resume._id}>
                          {resume.fileName} (Uploaded {new Date(resume.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">unfold_more</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Optimization Pathway */}
            <div className="mb-8 space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">2. Select Optimization Pathway</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={parsing || loading}
                  onClick={() => setOptimizationType('section')}
                  className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none ${
                    optimizationType === 'section'
                      ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md shadow-blue-500/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-transparent'
                  }`}
                >
                  <span className={`p-2.5 rounded-xl material-symbols-rounded ${optimizationType === 'section' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>edit_note</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Specific Section</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Optimize individual bullet points, summary paragraphs, or bio segments (max 5,000 characters).</p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={parsing || loading}
                  onClick={() => setOptimizationType('overall')}
                  className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none ${
                    optimizationType === 'overall'
                      ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md shadow-blue-500/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-transparent'
                  }`}
                >
                  <span className={`p-2.5 rounded-xl material-symbols-rounded ${optimizationType === 'overall' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>description</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Overall Resume</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Polishes the full resume text while preserving structural section titles and bullet layouts (max 15,000 characters).</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Text Preview & Edit */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">3. Review and Refine Content</label>
              <div className="relative">
                <textarea 
                  value={text}
                  disabled={parsing || loading}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-48 md:h-60 p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base leading-relaxed placeholder:text-slate-400 resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                  placeholder={optimizationType === 'overall' ? "Paste or import your full resume text here to analyze..." : "Paste your resume section or paragraph here to analyze (minimum 20 characters)..."}
                />
                {parsing && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
                    <span className="material-symbols-rounded text-blue-600 text-3xl animate-spin mb-2">sync</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Loading document text...</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-rounded text-base">error</span>
                {error}
              </div>
            )}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="material-symbols-rounded text-sm">info</span>
                <span>{text.length} / {maxCharLimit} characters</span>
              </div>
              <button 
                onClick={handleHumanize}
                disabled={loading || parsing || text.trim().length < 20}
                className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                {loading ? 'Analyzing...' : 'Humanize & Optimize'}
              </button>
            </div>
          </section>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm min-h-[300px] transition-colors">
              <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-slate-600 dark:text-slate-300 animate-pulse transition-colors">Running advanced linguistic analysis...</p>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center gap-4">
                <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-white transition-colors">Analysis Insights</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Circular Gauge & High-Level Stats */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 p-8 rounded-[32px] flex flex-col items-center justify-center text-center transition-colors">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{ 
                        background: `conic-gradient(from 0deg, #3525cd 0% ${result.aiProbability}%, ${theme === 'dark' ? '#334155' : '#e6e8ea'} ${result.aiProbability}% 100%)`
                      }}
                    ></div>
                    <div className="absolute inset-2 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center transition-colors">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">{result.aiProbability}%</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">AI Likeness</span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100/50 dark:border-slate-700 transition-colors">
                      <span className="text-xs text-slate-500">Burstiness</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{result.linguisticAnalysis.burstiness.split('.')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100/50 dark:border-slate-700 transition-colors">
                      <span className="text-xs text-slate-500">Perplexity</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{result.linguisticAnalysis.perplexity.split('.')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100/50 dark:border-slate-700 transition-colors">
                      <span className="text-xs text-slate-500">Repetitiveness</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{result.linguisticAnalysis.repetitiveness.split('.')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Key Differentiators */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 p-8 rounded-[32px] transition-colors flex flex-col justify-center">
                  <h4 className="text-lg font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-2 transition-colors">
                    <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">warning</span>
                    Linguistic Markers Detected
                  </h4>
                  <div className="space-y-6">
                    {result.keyDifferentiators.map((diff, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className={`w-1.5 h-12 rounded-full mt-1 shrink-0 ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors">{diff.split(':')[0]}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {diff.split(':')[1] || 'Detected AI signature in formatting or phrasing.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="bg-slate-100/60 dark:bg-slate-900/40 p-8 md:p-10 rounded-[32px] border border-slate-200/50 dark:border-slate-800/80 transition-colors">
                
                {/* Visual Legend Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm transition-colors">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors flex items-center gap-2">
                      <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">auto_awesome</span>
                      Comparative Document Review
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors">Hover over any highlighted text segment to inspect recommendations.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2 bg-red-500/5 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-600 dark:text-red-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 block animate-pulse"></span>
                      <span>Robotic Patterns (Red)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/5 dark:bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 text-green-600 dark:text-green-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 block animate-pulse"></span>
                      <span>Optimized Tone (Green)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Original Sheet */}
                  <div className="bg-white dark:bg-slate-950 p-8 md:p-10 rounded-[24px] shadow-xl border border-slate-100 dark:border-slate-800/60 transition-colors flex flex-col h-[650px]">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center shrink-0">
                      <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Original Document</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded">AI Likeness Detected</span>
                    </div>
                    <div 
                      ref={leftSheetRef}
                      onScroll={handleLeftScroll}
                      className="font-serif leading-relaxed text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap flex-1 overflow-y-auto select-text pr-2 scrollbar-thin"
                    >
                      {highlightText(originalSubmittedText, result.explanations, 'original')}
                    </div>
                  </div>

                  {/* Humanized Sheet */}
                  <div className="bg-white dark:bg-slate-950 p-8 md:p-10 rounded-[24px] shadow-xl border border-green-500/20 dark:border-green-500/30 transition-colors relative overflow-hidden flex flex-col h-[650px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent pointer-events-none"></div>
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center shrink-0">
                      <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">Humanized Version</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 rounded">100% Polish Ready</span>
                    </div>
                    <div 
                      ref={rightSheetRef}
                      onScroll={handleRightScroll}
                      className="font-serif leading-relaxed text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap flex-1 overflow-y-auto select-text pr-2 scrollbar-thin"
                    >
                      {highlightText(result.humanizedText, result.explanations, 'humanized')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions Tabs */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 p-8 rounded-[32px] transition-colors">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Adjustment Suggestions</h3>
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-700 transition-colors">
                  {['tone', 'syntax', 'vocabulary'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs capitalize transition-all ${
                        activeTab === tab 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {activeTab === 'tone' && result.toneSuggestions.map((sug, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl transition-colors">
                      <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 shrink-0">palette</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{sug}</p>
                    </div>
                  ))}
                  {activeTab === 'syntax' && result.syntaxSuggestions.map((sug, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl transition-colors">
                      <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 shrink-0">format_align_left</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{sug}</p>
                    </div>
                  ))}
                  {activeTab === 'vocabulary' && result.vocabularySuggestions.map((sug, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl transition-colors">
                      <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 shrink-0">abc</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evolution Breakdown */}
              <div className="bg-slate-100 dark:bg-slate-800/60 p-8 rounded-[32px] border border-slate-200/20 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 transition-colors">Evolution Breakdown</h3>
                <div className="space-y-4">
                  {result.explanations.map((exp, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300">
                      <div className="flex-1 w-full">
                        <div className="text-[9px] uppercase font-black text-red-500 mb-1 tracking-wider">AI Pattern</div>
                        <div className="text-slate-400 dark:text-slate-500 line-through text-xs font-medium italic">"{exp.originalPhrase}"</div>
                      </div>
                      <div className="hidden md:block">
                        <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">trending_flat</span>
                      </div>
                      <div className="flex-1 w-full">
                        <div className="text-[9px] uppercase font-black text-blue-600 dark:text-blue-400 mb-1 tracking-wider">Human Choice</div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">"{exp.humanizedPhrase}"</div>
                      </div>
                      <div className="w-full md:w-1/3 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border-l-4 border-indigo-500 leading-relaxed transition-colors">
                        <span className="font-bold block text-slate-700 dark:text-slate-300 mb-1">Reasoning:</span>
                        {exp.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default AIHumanizerPage;
