import React, { useState, useEffect } from 'react';
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

  const handleHumanize = async () => {
    if (!text || text.trim().length < 20) {
      setError('Please provide text of at least 20 characters.');
      return;
    }
    if (text.length > 5000) {
      setError('Text exceeds the 5000 character limit.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setOriginalSubmittedText(text);

    try {
      const res = await api.post('/resume/humanize', { text });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight words or characters (fallback simple rendering)
  const renderHighlightedText = (textToHighlight) => {
    return textToHighlight;
  };

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
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 material-symbols-rounded">edit_note</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Analyze New Segment</h3>
            </div>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-48 md:h-60 p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base leading-relaxed placeholder:text-slate-400 resize-none transition-colors" 
              placeholder="Paste your resume text here to analyze (minimum 20 characters)..."
            />
            {error && (
              <div className="mt-4 text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-rounded text-base">error</span>
                {error}
              </div>
            )}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="material-symbols-rounded text-sm">info</span>
                <span>{text.length} / 5000 characters</span>
              </div>
              <button 
                onClick={handleHumanize}
                disabled={loading || text.trim().length < 20}
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
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 p-8 rounded-[32px] transition-colors">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Text Comparison</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors">Compare the robotic signatures against the optimized version.</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full text-xs transition-colors">
                    <span className="material-symbols-rounded text-sm">auto_awesome</span>
                    <span>Humanized output ready</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Text */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-4 tracking-widest">Original Text</div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic text-sm">
                      {originalSubmittedText}
                    </p>
                  </div>
                  {/* Humanized Text */}
                  <div className="bg-blue-50/30 dark:bg-blue-950/20 p-6 rounded-2xl border border-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                      <span className="material-symbols-rounded text-blue-600/30 group-hover:scale-125 transition-all duration-300">auto_awesome</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-4 tracking-widest">Optimized Human Text</div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm font-semibold transition-colors">
                      {renderHighlightedText(result.humanizedText)}
                    </p>
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
