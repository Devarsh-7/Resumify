import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthContext } from '../../context/AuthContext';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Logged-in users should be in the app, not on the landing page
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    { title: 'ATS Score Analysis', desc: 'Instantly see how your resume performs against top-tier systems.', icon: 'analytics', color: 'blue' },
    { title: 'AI Suggestions', desc: 'Get actionable optimizations to make your experience stand out.', icon: 'psychology', color: 'purple' },
    { title: 'Skill Gap Detection', desc: 'Identify missing keywords required for your specific job roles.', icon: 'location_searching', color: 'teal' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-manrope pt-20 transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold tracking-wider uppercase transition-colors">
            <span className="material-symbols-rounded text-sm">auto_awesome</span> Next-Gen Analysis Powered by AI
          </div>
          <h1 className="text-7xl font-black text-slate-900 dark:text-white leading-[1.1] transition-colors">
            Get Your Resume <br/>
            <span className="text-blue-600 italic">ATS-Ready</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed transition-colors">
            Don't let algorithms reject your dream career. Use our Intelligent Ledger to analyze, optimize, and outperform the competition.
          </p>
          <div className="flex gap-4">
            <Link to="/auth" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-950/60 hover:scale-105 transition-all active:scale-95">
              Get Started
            </Link>
            <Link to="/dashboard" className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
              <span className="material-symbols-rounded">upload_file</span> Upload Resume
            </Link>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" alt="User" />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Joined by 12,000+ professionals this month</p>
          </div>
        </div>
        
        <div className="relative">
          <div className="bg-slate-900 rounded-[40px] p-8 shadow-2xl rotate-3 scale-95 border-8 border-white dark:border-slate-800 transition-colors">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl overflow-hidden flex items-center justify-center">
              <div className="text-blue-400 opacity-20 transform scale-150">
                 <span className="material-symbols-rounded text-[120px]">monitoring</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-12 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-700 animate-[bounce_3s_infinite] transition-colors">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-rounded">check</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Score Improved</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">From 42 to 94 points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-slate-800 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-16 text-center lg:text-left transition-colors">Precision Engineering for your Career</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl group hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-black/50 transition-all duration-500 border border-transparent hover:border-blue-50 dark:hover:border-slate-700">
                <div className={`w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500`}>
                  <span className="material-symbols-rounded text-3xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
