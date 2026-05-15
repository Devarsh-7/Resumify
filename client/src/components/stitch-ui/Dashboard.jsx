import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import api from '../../api/axiosConfig';
import { AuthContext } from '../../context/AuthContext';
import { generatePDFReport } from '../../utils/reportGenerator';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
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

  const fetchHistory = async () => {
    try {
      const res = await api.get('/resume/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const processFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }

    setUploading(true);
    try {
      const res = await api.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Redirect to the new results page!
      navigate(`/analysis/${res.data.analysis._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    try {
      await api.delete(`/resume/analysis/${id}`);
      setHistory(history.filter(item => item._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickDownload = (item) => {
    // Navigate to results page with auto-download param
    navigate(`/analysis/${item._id}?download=true`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-manrope transition-colors duration-300">
      <Navbar isLoggedIn={true} />
      <Sidebar activeTab="Dashboard" />
      
      <main className="flex-1 ml-64 pt-24 p-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-slate-500 dark:text-slate-400 transition-colors">Your intelligent analyst has identified 3 new matching opportunities today.</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                 onClick={toggleTheme}
                 className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                 title="Toggle Theme"
              >
                <span className="material-symbols-rounded">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              </button>

              <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm flex items-center gap-3 border border-slate-100 dark:border-slate-700 transition-colors">
                 <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=DBEAFE&color=3B82F6`} 
                      className="w-12 h-12 rounded-xl" alt="Avatar" />
                 <div className="pr-4">
                   <p className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{user?.name}</p>
                   <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Pro Account</p>
                 </div>
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Upload Area */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] p-8 shadow-sm transition-colors duration-300">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Analyze New Resume</h2>
                <div className="bg-blue-50 text-blue-700 text-xs font-bold p-3 rounded-xl mb-4 text-left flex items-start gap-2">
                  <span className="material-symbols-rounded text-sm">info</span>
                  <p>Optional: Leave blank for a General ATS Compatibility check, or paste a job description for a Targeted Analysis.</p>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="e.g. We are looking for a Senior Product Designer with experience in Figma, user research, and agile workflows..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl p-4 text-sm focus:border-blue-500 outline-none mb-6 min-h-[160px] transition-colors"
                />
                <label 
                  className={`block border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer ${dragActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-inner' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/30'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${dragActive ? 'bg-blue-600 text-white scale-110' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                    <span className="material-symbols-rounded text-3xl">{uploading ? 'hourglass_top' : dragActive ? 'download' : 'cloud_upload'}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1 transition-colors">{uploading ? 'Analyzing Document...' : dragActive ? 'Drop it here!' : 'Upload & Analyze Resume'}</h3>
                  <p className="text-xs text-slate-500 mb-4 text-center">{dragActive ? 'The AI is ready for your file' : 'PDF or DOCX max 5MB'}</p>
                  <div className={`px-6 py-2 font-bold rounded-xl inline-block text-sm transition-all ${uploading ? 'bg-blue-600 text-white animate-pulse' : dragActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {uploading ? 'Processing AI Data...' : 'Browse File'}
                  </div>
                </label>
              </div>

              {/* Recent Analyses */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg transition-colors">Recent Analyses</h3>
                  <Link to="/resumes" state={{ activeTab: 'History' }} className="text-blue-600 text-sm font-bold">View All</Link>
                </div>
                {loading ? (
                  <p className="text-slate-400 px-4">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-slate-400 px-4">No analyses found. Upload a resume to begin.</p>
                ) : (
                  history.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700 flex items-center gap-6 hover:shadow-md transition-all duration-300">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <span className="material-symbols-rounded">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate transition-colors" title={item.fileName}>{item.fileName || 'Resume'}</h4>
                        <p className="text-xs text-slate-500 truncate">{item.jobTitle || 'Analysis'} • Analyzed {new Date(item.analyzedAt || item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 px-2">
                        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">{item.atsScore || 0}% Match</div>
                        <div className="flex items-center gap-2">
                          <Link to={`/analysis/${item._id}`} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Details">
                            <span className="material-symbols-rounded">visibility</span>
                          </Link>
                          <button 
                            onClick={() => handleQuickDownload(item)} 
                            disabled={downloadingId === item._id}
                            className={`p-2 transition-colors ${downloadingId === item._id ? 'text-blue-600 animate-spin' : 'text-slate-400 hover:text-blue-600'}`} 
                            title="Download Report"
                          >
                            <span className="material-symbols-rounded">
                              {downloadingId === item._id ? 'refresh' : 'download'}
                            </span>
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete Analysis">
                            <span className="material-symbols-rounded">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <div className="bg-blue-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/50 transition-shadow duration-300">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-8 opacity-80">All-Time Stats</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-black">{history.length}</span>
                </div>
                <p className="text-sm opacity-80 mb-4">Total Analyses</p>
                <div className="flex items-center gap-2 text-xs opacity-70">
                  <span className="material-symbols-rounded text-sm">calendar_today</span>
                  <span>Since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'joining'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 transition-colors duration-300">
                 <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white transition-colors">
                   <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">auto_graph</span> Smart Insights
                 </h3>
                 <div className="space-y-2">
                   {['Top 5% Candidate', 'Keyword Optimization', 'Industry Benchmarked', 'ATS Friendly'].map(tag => (
                     <div key={tag} className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-700 transition-colors">
                       {tag}
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
