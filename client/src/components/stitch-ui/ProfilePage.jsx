import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import api from '../../api/axiosConfig';

const ProfilePage = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    targetRole: user?.careerDefaults?.targetRole || '',
    industry: user?.careerDefaults?.industry || '',
    experienceLevel: user?.careerDefaults?.experienceLevel || '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Update local state if user context loads later
  useEffect(() => {
     if(user) {
        setFormData(prev => ({
           ...prev,
           name: user.name || '',
           email: user.email || '',
           targetRole: user.careerDefaults?.targetRole || '',
           industry: user.careerDefaults?.industry || '',
           experienceLevel: user.careerDefaults?.experienceLevel || ''
        }));
     }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        careerDefaults: {
          targetRole: formData.targetRole,
          industry: formData.industry,
          experienceLevel: formData.experienceLevel,
        }
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put('/auth/profile', payload);
      
      // Update the token if a new one was sent
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      
      updateUser(res.data);
      setMessage('Profile updated successfully!');
      setFormData(prev => ({...prev, password: ''})); // clear password field
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-manrope transition-colors duration-300">
      <Navbar isLoggedIn={true} />
      <Sidebar activeTab="Profile" />
      
      <main className="flex-1 ml-64 pt-24 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="mb-12">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors">Profile Settings</h1>
            <p className="text-slate-500">Manage your personal information, career defaults, and system preferences.</p>
          </header>

          {message && (
             <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border border-green-200">
               <span className="material-symbols-rounded text-xl">check_circle</span>
               <p className="font-bold text-sm">{message}</p>
             </div>
          )}

          {error && (
             <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border border-red-200">
               <span className="material-symbols-rounded text-xl">error</span>
               <p className="font-bold text-sm">{error}</p>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-12 transition-colors duration-300">
               <div className="md:w-1/3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Personal Info</h2>
                  <p className="text-sm text-slate-500">Update your name, email address, or change your password.</p>
                  
                  <div className="mt-8 flex flex-col items-center border border-slate-100 p-6 rounded-3xl bg-slate-50">
                    <img 
                       src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=DBEAFE&color=3B82F6&size=128&rounded=false`} 
                       className="w-24 h-24 rounded-2xl mb-4 shadow-sm" alt="Avatar" 
                    />
                    <p className="font-bold text-slate-900">{user?.name}</p>
                    <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wider">Pro Account</div>
                  </div>
               </div>
               
               <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required
                           className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                           className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">New Password (Optional)</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" minLength={6}
                           className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
               </div>
            </div>

            {/* Career Defaults */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-12 transition-colors duration-300">
               <div className="md:w-1/3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Career Defaults</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">Storing these allows the AI to provide relevant advice automatically even when you don't paste a job description.</p>
               </div>
               
               <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Target Job Title</label>
                    <input type="text" name="targetRole" value={formData.targetRole} onChange={handleChange} placeholder="e.g. Senior Frontend Engineer"
                           className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Industry</label>
                      <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Technology"
                             className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Experience Level</label>
                      <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none">
                        <option value="">Select Level...</option>
                        <option value="Entry-level">Entry-level (0-2 years)</option>
                        <option value="Mid-level">Mid-level (3-5 years)</option>
                        <option value="Senior">Senior (5+ years)</option>
                        <option value="Executive">Executive / Director</option>
                      </select>
                    </div>
                  </div>
               </div>
            </div>

            {/* Application Preferences */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-12 transition-colors duration-300">
               <div className="md:w-1/3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">App Preferences</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">Customize your viewing experience and interface settings.</p>
               </div>
               
               <div className="flex-1 space-y-6 flex items-center">
                  <div className="flex items-center justify-between w-full p-4 border border-slate-100 rounded-2xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-rounded text-blue-600">{localStorage.getItem('theme') === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Theme Appearance</p>
                        <p className="text-xs text-slate-500">Toggle between light and dark modes.</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const currentTheme = localStorage.getItem('theme');
                        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                        localStorage.setItem('theme', newTheme);
                        if (newTheme === 'dark') {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                        // Force re-render of this component to update the icon/toggle state
                        setFormData({...formData}); 
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${localStorage.getItem('theme') === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${localStorage.getItem('theme') === 'dark' ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
               <button type="button" className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Discard Changes</button>
               <button type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-950/60 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                 {saving ? <span className="material-symbols-rounded animate-spin">refresh</span> : null}
                 {saving ? 'Saving...' : 'Save Profile'}
               </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border-2 border-red-200 dark:border-red-900/50 shadow-sm transition-colors duration-300">
             <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                <div>
                   <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                     <span className="material-symbols-rounded">warning</span>
                     Danger Zone
                   </h2>
                   <p className="text-sm text-slate-500 leading-relaxed max-w-md">Permanently delete your account, all resumes, and analysis history. This action is <strong>irreversible</strong>.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap"
                >
                  Delete Account
                </button>
             </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-rounded text-red-600 text-2xl">delete_forever</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account</h3>
                    <p className="text-sm text-slate-500">This cannot be undone</p>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    This will permanently delete your profile, all uploaded resumes, and every analysis result. You will be logged out immediately.
                  </p>
                </div>

                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Type <span className="text-red-600 font-mono">DELETE</span> to confirm
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText} 
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors mb-6 font-mono"
                />

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        await api.delete('/auth/account');
                        logout();
                        navigate('/', { replace: true });
                      } catch (err) {
                        setError(err.response?.data?.message || 'Failed to delete account');
                        setShowDeleteModal(false);
                        setDeleting(false);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Deleting...</>
                    ) : (
                      'Delete Forever'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
