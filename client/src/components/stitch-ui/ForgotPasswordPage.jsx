import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { requestPasswordReset } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      // Navigate to reset password page and pass the email
      navigate('/reset-password', { state: { email }, replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset');
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
           <h2 className="text-4xl font-headline font-black mb-6 text-slate-900 dark:text-white">Recover your account.</h2>
           <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
             Don't worry, it happens to the best of us. We'll get you back into your account in no time.
           </p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center px-8 sm:px-16 lg:px-24 transition-colors">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-8">R</div>
          
          <h1 className="text-3xl font-headline font-bold mb-2 text-slate-900 dark:text-white">Forgot Password</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
            Enter the email address associated with your account, and we'll send you a 6-digit reset code.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-rounded text-[20px] text-red-500">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide">Email Address</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-0 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-t-lg focus:ring-0 focus:border-blue-600 dark:focus:border-blue-400 transition-colors outline-none font-medium" 
                placeholder="alex@example.com"
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
                  Sending...
                </>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Remembered your password?{' '}
            <button onClick={() => navigate('/auth')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
