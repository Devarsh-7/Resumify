import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import api from '../../api/axiosConfig';
import { generatePDFReport } from '../../utils/reportGenerator';

const ResultsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAutoDownloaded = useRef(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/resume/analysis/${id}`)
      .then(res => setAnalysis(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load analysis'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (analysis && !hasAutoDownloaded.current) {
       const queryParams = new URLSearchParams(location.search);
       if (queryParams.get('download') === 'true') {
          hasAutoDownloaded.current = true;
          // Remove the query param so refreshing doesn't re-trigger
          navigate(`/analysis/${id}`, { replace: true });
          handleDownload();
       }
    }
  }, [analysis, location.search]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePDFReport('report-content', { 
        score: analysis.atsScore, 
        fileName: analysis.fileName,
        analysis: analysis 
      });
    } catch (err) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-surface font-body text-on-surface flex min-h-screen">
        <Navbar isLoggedIn={true} onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <Sidebar activeTab="Dashboard" isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64 pt-24 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 inline-block border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-bold text-slate-500 font-headline animate-pulse">Loading expert analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface font-body text-on-surface flex min-h-screen">
        <Navbar isLoggedIn={true} onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <Sidebar activeTab="Dashboard" isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64 pt-24 items-center justify-center px-6">
          <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-8 rounded-2xl max-w-md text-center border border-red-200 dark:border-red-900/50">
            <span className="material-symbols-rounded text-4xl mb-4 text-red-500">error</span>
            <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
            <p>{error}</p>
            <Link to="/dashboard" className="inline-block mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  // Render logic mapping
  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-body text-slate-900 dark:text-slate-100 flex min-h-screen transition-colors duration-300">
      <Navbar isLoggedIn={true} onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      <Sidebar activeTab="Dashboard" isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64">
        <main id="report-content" className="flex-1 px-6 md:px-12 pb-12 pt-28 md:pt-32 max-w-6xl mx-auto w-full bg-slate-50 dark:bg-slate-900 transition-colors">

          {/* Hero Analysis Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-xs mb-4 tracking-wider uppercase">Analysis Complete</span>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                 Your resume matches <span className="text-blue-600 dark:text-blue-400 italic">{analysis.atsScore}%</span> of the job requirements.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed mb-8">
                 Targeting: <strong className="text-slate-900 dark:text-white font-bold">{analysis.jobTitle || 'Open Role'}</strong>. Our AI analyst has cross-referenced your profile. Here's how you can bridge the final gap.
              </p>
              <div className="flex flex-wrap gap-4 no-print">
                <Link to="/dashboard" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-xl font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  Back to Dashboard
                </Link>
                <button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 ${downloading ? 'bg-slate-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <span className={`material-symbols-rounded ${downloading ? 'animate-spin' : ''}`}>
                    {downloading ? 'refresh' : 'download'}
                  </span>
                  {downloading ? 'Generating Report...' : 'Download PDF Report'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-110"></div>
                <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Inline circular progress CSS */}
                    <div 
                      className="absolute inset-0 rounded-full" 
                      style={{ background: `conic-gradient(from 0deg, #2563eb 0% ${analysis.atsScore}%, ${document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'} ${analysis.atsScore}% 100%)`}}
                    ></div>
                    <div className="absolute inset-2 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center">
                      <span className="text-6xl font-black text-slate-900 dark:text-white leading-none">{analysis.atsScore}</span>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">ATS Score</span>
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Status: {analysis.atsScore >= 80 ? 'Interview Ready' : 'Needs Optimization'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid Breakdown */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Found Skills Card */}
            {analysis.jobTitle !== 'General Analysis' && (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
                <h3 className="text-xl font-bold font-headline mb-6 flex items-center justify-between text-slate-900 dark:text-white">
                  <span>Matched Skills</span>
                  <span className="material-symbols-rounded text-green-600 dark:text-green-400">check_circle</span>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Strengths found in your resume matching the target job description.</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedSkills?.length > 0 ? analysis.matchedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-green-50 dark:bg-green-950/40 rounded-full text-xs font-bold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                      {skill}
                    </span>
                  )) : <span className="text-sm text-slate-400">No strong matches found.</span>}
                </div>
                
                <h4 className="font-bold text-sm mt-8 mb-4 text-slate-900 dark:text-white">Highlighted Strengths</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4">
                   {analysis.strengths?.map((str, idx) => (
                     <li key={idx}>{str}</li>
                   ))}
                </ul>
              </div>
            )}

            {/* Missing Skills / ATS Issues Card */}
            <div className={`bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors ${analysis.jobTitle === 'General Analysis' ? 'md:col-span-2' : ''}`}>
              <h3 className="text-xl font-bold font-headline mb-6 flex items-center justify-between text-slate-900 dark:text-white">
                <span>{analysis.jobTitle === 'General Analysis' ? 'ATS Issues & Formatting' : 'Gap Analysis'}</span>
                <span className="material-symbols-rounded text-red-500 dark:text-red-400">warning</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {analysis.jobTitle === 'General Analysis' 
                  ? 'These elements might cause applicant tracking systems to misread your resume.' 
                  : 'Add these top-tier keywords to increase your visibility for this role.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills?.length > 0 ? analysis.missingSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-full text-xs font-bold text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700">
                    {skill}
                  </span>
                )) : <span className="text-sm text-green-600 dark:text-green-400 font-bold">{analysis.jobTitle === 'General Analysis' ? 'No major ATS formatting issues detected!' : 'You hit all the keywords!'}</span>}
              </div>

              {analysis.jobTitle === 'General Analysis' && analysis.strengths?.length > 0 && (
                <>
                  <h4 className="font-bold text-sm mt-8 mb-4 text-slate-900 dark:text-white">General Strengths</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4 mb-2">
                     {analysis.strengths.map((str, idx) => (
                       <li key={idx}>{str}</li>
                     ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          {/* AI Suggestions: The Editorial List */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h3 className="text-3xl font-headline font-extrabold mb-2 text-slate-900 dark:text-white">AI Suggestions</h3>
                <p className="text-slate-600 dark:text-slate-400">Prioritized improvements based on current market trends.</p>
              </div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-4 py-2 rounded-full text-sm">
                <span className="material-symbols-rounded text-sm">auto_awesome</span>
                <span>Analyst Mode Active</span>
              </div>
            </div>
            
            <div className="space-y-0">
              {analysis.suggestions?.map((suggestion, idx) => (
                <div key={idx} className={`group py-8 flex flex-col md:flex-row gap-8 items-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-2xl px-4 -mx-4 ${idx > 0 && 'border-t border-slate-100 dark:border-slate-700'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${idx % 3 === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : idx % 3 === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'}`}>
                    <span className="material-symbols-rounded">edit_note</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Optimization Opportunity</h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResultsPage;
