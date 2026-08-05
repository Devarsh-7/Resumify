import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { AuthContext } from '../../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const { user, login, signup, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard', { replace: true });
      } else {
        await signup(formData.name, formData.email, formData.password);
        // signup now returns without logging in — redirect to verify
        navigate('/verify-email', { state: { email: formData.email }, replace: true });
      }
    } catch (err) {
      // Handle "needs verification" redirect from login
      if (err.response?.data?.needsVerification) {
        navigate('/verify-email', { state: { email: err.response.data.email }, replace: true });
        return;
      }
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-body w-full transition-colors duration-300">
      <div className="hidden lg:flex w-1/2 bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden flex-col items-center justify-center p-12 transition-colors">
        <div className="absolute inset-0 bg-blue-600/5"></div>
        <div className="relative z-10 w-full max-w-md">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-12 shadow-2xl shadow-blue-500/30">R</div>
           <h2 className="text-4xl font-headline font-black mb-6 text-slate-900 dark:text-white">Build your legacy with precision.</h2>
           <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
             Join thousands of professionals optimizing their careers using our Intelligent Ledger technology.
           </p>
           
           <div className="space-y-6">
             {[{title: "AI-Powered", text: "Resume analysis based on thousands of placements."},
               {title: "ATS-Ready", text: "Formatting that passes strict screening algorithms."},
               {title: "Gap Detection", text: "Identify missing skills before you apply."}].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-slate-700">
                   <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                     <span className="material-symbols-rounded text-[20px]">check</span>
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 dark:text-white">{feature.title}</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-400">{feature.text}</p>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center px-8 sm:px-16 lg:px-24 transition-colors">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-8">R</div>
          
          <h1 className="text-3xl font-headline font-bold mb-2 text-slate-900 dark:text-white">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
            {isLogin ? "Enter your details to access your dashboard." : "Start optimizing your resume today."}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-rounded text-[20px] text-red-500">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide">Full Name</label>
                <input 
                  type="text" name="name" required={!isLogin} value={formData.name} onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-800 border-0 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-t-lg focus:ring-0 focus:border-blue-600 dark:focus:border-blue-400 transition-colors outline-none font-medium" 
                  placeholder="Alex Rivera"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide">Email Address</label>
              <input 
                type="email" name="email" required value={formData.email} onChange={handleChange}
                className="w-full bg-white dark:bg-slate-800 border-0 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-t-lg focus:ring-0 focus:border-blue-600 dark:focus:border-blue-400 transition-colors outline-none font-medium" 
                placeholder="alex@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide flex justify-between">
                <span>Password</span>
                {isLogin && <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="text-blue-600 dark:text-blue-400 hover:underline">Forgot?</a>}
              </label>
              <input 
                type="password" name="password" required value={formData.password} onChange={handleChange}
                className="w-full bg-white dark:bg-slate-800 border-0 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-t-lg focus:ring-0 focus:border-blue-600 dark:focus:border-blue-400 transition-colors outline-none font-medium" 
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold mt-8 shadow-lg shadow-blue-200 dark:shadow-blue-950/60 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Signing In...' : 'Signing Up...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    await googleLogin(credentialResponse.credential);
                    navigate('/dashboard', { replace: true });
                  } catch (err) {
                    setError(err.response?.data?.message || 'Google sign-in failed');
                  }
                }}
                onError={() => {
                  setError('Google sign-in failed. Please try again.');
                }}
                theme="outline"
                size="large"
                width="350"
                text="continue_with"
                shape="pill"
              />
            </GoogleOAuthProvider>
          </div>

          <p className="mt-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
