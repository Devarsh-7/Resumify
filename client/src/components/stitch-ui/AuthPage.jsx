import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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
    <div className="min-h-screen flex text-on-surface font-body w-full">
      <div className="hidden lg:flex w-1/2 bg-surface-container-highest relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="relative z-10 w-full max-w-md">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary font-bold text-3xl mb-12 shadow-2xl shadow-primary/30">R</div>
           <h2 className="text-4xl font-headline font-black mb-6">Build your legacy with precision.</h2>
           <p className="text-lg text-on-surface-variant leading-relaxed mb-12">
             Join thousands of professionals optimizing their careers using our Intelligent Ledger technology.
           </p>
           
           <div className="space-y-6">
             {[{title: "AI-Powered", text: "Resume analysis based on thousands of placements."},
               {title: "ATS-Ready", text: "Formatting that passes strict screening algorithms."},
               {title: "Gap Detection", text: "Identify missing skills before you apply."}].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest/50 backdrop-blur border border-white/20">
                   <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center text-on-primary-fixed shrink-0">
                     <span className="material-symbols-rounded text-[20px]">check</span>
                   </div>
                   <div>
                     <h4 className="font-bold">{feature.title}</h4>
                     <p className="text-sm text-on-surface-variant">{feature.text}</p>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 bg-surface flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold text-xl mb-8">R</div>
          
          <h1 className="text-3xl font-headline font-bold mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
          <p className="text-on-surface-variant mb-8 font-medium">
            {isLogin ? "Enter your details to access your dashboard." : "Start optimizing your resume today."}
          </p>

          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-rounded text-[20px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant tracking-wide">Full Name</label>
                <input 
                  type="text" name="name" required={!isLogin} value={formData.name} onChange={handleChange}
                  className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant/30 px-4 py-3 rounded-t-lg focus:ring-0 focus:border-primary transition-colors outline-none font-medium" 
                  placeholder="Alex Rivera"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant tracking-wide">Email Address</label>
              <input 
                type="email" name="email" required value={formData.email} onChange={handleChange}
                className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant/30 px-4 py-3 rounded-t-lg focus:ring-0 focus:border-primary transition-colors outline-none font-medium" 
                placeholder="alex@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant tracking-wide flex justify-between">
                <span>Password</span>
                {isLogin && <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="text-primary hover:underline">Forgot?</a>}
              </label>
              <input 
                type="password" name="password" required value={formData.password} onChange={handleChange}
                className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant/30 px-4 py-3 rounded-t-lg focus:ring-0 focus:border-primary transition-colors outline-none font-medium" 
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold mt-8 shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
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
          </div>

          <p className="mt-10 text-center text-sm font-medium text-on-surface-variant">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
