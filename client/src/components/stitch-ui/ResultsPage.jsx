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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 inline-block border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="font-bold text-slate-500 font-headline animate-pulse">Loading expert analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-error-container text-on-error-container p-8 rounded-2xl max-w-md text-center">
          <span className="material-symbols-rounded text-4xl mb-4">error</span>
          <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
          <p>{error}</p>
          <Link to="/dashboard" className="inline-block mt-6 px-6 py-2 bg-error text-on-error rounded-lg font-bold hover:bg-red-800 transition-colors">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  // Render logic mapping
  return (
    <div className="bg-surface font-body text-on-surface flex min-h-screen">
      <Sidebar activeTab="Dashboard" />
      
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Navbar isLoggedIn={true} />
        
        <main id="report-content" className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full pt-28 bg-surface dark:bg-slate-900 transition-colors">

          {/* Hero Analysis Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold text-xs mb-4 tracking-wider uppercase">Analysis Complete</span>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight leading-tight mb-6">
                 Your resume matches <span className="text-primary italic">{analysis.atsScore}%</span> of the job requirements.
              </h2>
              <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed mb-8">
                 Targeting: <strong>{analysis.jobTitle || 'Open Role'}</strong>. Our AI analyst has cross-referenced your profile. Here's how you can bridge the final gap.
              </p>
              <div className="flex flex-wrap gap-4 no-print">
                <Link to="/dashboard" className="bg-surface-container-lowest text-primary px-8 py-4 rounded-lg font-bold shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-all">
                  Back to Dashboard
                </Link>
                <button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 ${downloading ? 'bg-slate-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
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
                <div className="absolute inset-0 bg-secondary/10 blur-3xl rounded-full scale-110"></div>
                <div className="relative bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white/50 flex flex-col items-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Inline circular progress CSS since we can't easily inject the style block globally */}
                    <div 
                      className="absolute inset-0 rounded-full" 
                      style={{ background: `conic-gradient(from 0deg, #3525cd 0% ${analysis.atsScore}%, #e0e3e5 ${analysis.atsScore}% 100%)`}}
                    ></div>
                    <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-6xl font-black text-on-surface leading-none">{analysis.atsScore}</span>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">ATS Score</span>
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <p className="text-sm text-on-surface-variant font-medium">Status: {analysis.atsScore >= 80 ? 'Interview Ready' : 'Needs Optimization'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid Breakdown */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Found Skills Card */}
            {analysis.jobTitle !== 'General Analysis' && (
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col">
                <h3 className="text-xl font-bold font-headline mb-6 flex items-center justify-between">
                  <span>Matched Skills</span>
                  <span className="material-symbols-rounded text-green-600">check_circle</span>
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Strengths found in your resume matching the target job description.</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedSkills?.length > 0 ? analysis.matchedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-green-50 rounded-full text-xs font-bold text-green-700 border border-green-200">
                      {skill}
                    </span>
                  )) : <span className="text-sm text-slate-400">No strong matches found.</span>}
                </div>
                
                <h4 className="font-bold text-sm mt-8 mb-4">Highlighted Strengths</h4>
                <ul className="text-sm text-on-surface-variant space-y-2 list-disc pl-4">
                   {analysis.strengths?.map((str, idx) => (
                     <li key={idx}>{str}</li>
                   ))}
                </ul>
              </div>
            )}

            {/* Missing Skills / ATS Issues Card */}
            <div className={`bg-surface-container-low p-8 rounded-xl flex flex-col ${analysis.jobTitle === 'General Analysis' ? 'md:col-span-2' : ''}`}>
              <h3 className="text-xl font-bold font-headline mb-6 flex items-center justify-between">
                <span>{analysis.jobTitle === 'General Analysis' ? 'ATS Issues & Formatting' : 'Gap Analysis'}</span>
                <span className="material-symbols-rounded text-red-500">warning</span>
              </h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                {analysis.jobTitle === 'General Analysis' 
                  ? 'These elements might cause applicant tracking systems to misread your resume.' 
                  : 'Add these top-tier keywords to increase your visibility for this role.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills?.length > 0 ? analysis.missingSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white rounded-full text-xs font-bold text-on-surface-variant border border-outline-variant/30 text-red-600">
                    {skill}
                  </span>
                )) : <span className="text-sm text-green-600 font-bold">{analysis.jobTitle === 'General Analysis' ? 'No major ATS formatting issues detected!' : 'You hit all the keywords!'}</span>}
              </div>

              {analysis.jobTitle === 'General Analysis' && analysis.strengths?.length > 0 && (
                <>
                  <h4 className="font-bold text-sm mt-8 mb-4">General Strengths</h4>
                  <ul className="text-sm text-on-surface-variant space-y-2 list-disc pl-4 mb-2">
                     {analysis.strengths.map((str, idx) => (
                       <li key={idx}>{str}</li>
                     ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          {/* AI Suggestions: The Editorial List */}
          <section className="bg-white rounded-3xl p-10 shadow-sm border border-outline-variant/5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h3 className="text-3xl font-headline font-extrabold mb-2">AI Suggestions</h3>
                <p className="text-on-surface-variant">Prioritized improvements based on current market trends.</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-4 py-2 rounded-full text-sm">
                <span className="material-symbols-rounded text-sm">auto_awesome</span>
                <span>Analyst Mode Active</span>
              </div>
            </div>
            
            <div className="space-y-0">
              {analysis.suggestions?.map((suggestion, idx) => (
                <div key={idx} className={`group py-8 flex flex-col md:flex-row gap-8 items-start hover:bg-slate-50/50 transition-colors rounded-2xl px-4 -mx-4 ${idx > 0 && 'border-t border-slate-100'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${idx % 3 === 0 ? 'bg-secondary-fixed text-on-secondary-fixed' : idx % 3 === 1 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                    <span className="material-symbols-rounded">edit_note</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-2">Optimization Opportunity</h4>
                    <p className="text-on-surface-variant leading-relaxed">{suggestion}</p>
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
