import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import api from '../../api/axiosConfig';
import { AuthContext } from '../../context/AuthContext';

const MyResumesPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Vault'); // 'Vault' or 'History'
  const [vault, setVault] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/resume/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVault = async () => {
    try {
      const res = await api.get('/resume/vault');
      setVault(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchHistory(), fetchVault()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDeleteAnalysis = async (id) => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    try {
      await api.delete(`/resume/analysis/${id}`);
      setHistory(history.filter(item => item._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume from the vault? This won't affect past analyses.")) return;
    try {
      await api.delete(`/resume/vault/${id}`);
      setVault(vault.filter(item => item._id !== id));
    } catch (err) {
      console.error(err);
    }
  };
  const handleQuickDownload = (id) => {
    // Navigate to results page with auto-download param
    navigate(`/analysis/${id}?download=true`);
  };

  const filteredHistory = history.filter(item => 
    item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVault = vault.filter(item => 
    item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-manrope transition-colors duration-300">
      <Navbar isLoggedIn={true} />
      <Sidebar activeTab="My Resumes" />
      
      <main className="flex-1 ml-64 pt-24 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors">My Resumes</h1>
              <p className="text-slate-500 dark:text-slate-400 transition-colors">Manage your saved documents and analysis history.</p>
            </div>
            
            <div className="relative w-full md:w-80">
              <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Search resumes or roles..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-blue-500 dark:focus:border-blue-400 outline-none shadow-sm dark:text-white transition-all flex items-center"
              />
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('Vault')}
              className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'Vault' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Document Vault
            </button>
            <button 
              onClick={() => setActiveTab('History')}
              className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'History' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Analysis History
            </button>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <span className="material-symbols-rounded text-4xl animate-spin text-blue-600 mb-4">settings</span>
                <p className="text-slate-500">Retrieving your data...</p>
              </div>
            ) : activeTab === 'Vault' ? (
              /* Document Vault View */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVault.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] p-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                      <span className="material-symbols-rounded text-3xl">folder_off</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Vault is empty</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">Upload a new resume on the dashboard to automatically store it in your localized vault for quick re-analysis!</p>
                    <Link to="/dashboard" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-950/60 hover:bg-blue-700 transition-all inline-block">Go to Dashboard</Link>
                  </div>
                ) : (
                  filteredVault.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                      <div className="flex items-start justify-between mb-6">
                         <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                           <span className="material-symbols-rounded text-3xl">description</span>
                         </div>
                         <button onClick={() => handleDeleteResume(item._id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                           <span className="material-symbols-rounded text-xl">delete</span>
                         </button>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate" title={item.fileName}>{item.fileName}</h4>
                      <p className="text-xs text-slate-500 mb-6">Cached {new Date(item.createdAt).toLocaleDateString()}</p>
                      
                      <div className="flex gap-2">
                        <Link to="/dashboard" className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all">Re-Analyze</Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Analysis History View */
              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] p-20 text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No history matches</h3>
                    <p className="text-slate-500">We couldn't find any analyses matching your search terms.</p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-all">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                        <span className="material-symbols-rounded">analytics</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate" title={item.fileName}>{item.fileName}</h4>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-md">Analysis</span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{item.jobTitle} • {new Date(item.analyzedAt || item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-8 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col items-center">
                           <span className={`text-2xl font-black ${item.atsScore > 80 ? 'text-green-500' : item.atsScore > 50 ? 'text-orange-500' : 'text-red-500'}`}>{item.atsScore}%</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ATS Score</span>
                        </div>
                        <div className="flex gap-2">
                           <Link to={`/analysis/${item._id}`} className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all" title="View Details">
                             <span className="material-symbols-rounded text-xl">visibility</span>
                           </Link>
                           <button 
                             onClick={() => handleQuickDownload(item._id)} 
                             className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all" 
                             title="Download Report"
                           >
                             <span className="material-symbols-rounded text-xl">download</span>
                           </button>
                           <button onClick={() => handleDeleteAnalysis(item._id)} className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-all" title="Delete Analysis">
                             <span className="material-symbols-rounded text-xl">delete</span>
                           </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyResumesPage;
