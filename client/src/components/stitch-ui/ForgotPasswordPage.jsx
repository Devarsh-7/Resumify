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
    <div className="min-h-screen flex text-on-surface font-body w-full">
      <div className="hidden lg:flex w-1/2 bg-surface-container-highest relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="relative z-10 w-full max-w-md">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary font-bold text-3xl mb-12 shadow-2xl shadow-primary/30">R</div>
           <h2 className="text-4xl font-headline font-black mb-6">Recover your account.</h2>
           <p className="text-lg text-on-surface-variant leading-relaxed mb-12">
             Don't worry, it happens to the best of us. We'll get you back into your account in no time.
           </p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 bg-surface flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold text-xl mb-8">R</div>
          
          <h1 className="text-3xl font-headline font-bold mb-2">Forgot Password</h1>
          <p className="text-on-surface-variant mb-8 font-medium">
            Enter the email address associated with your account, and we'll send you a 6-digit reset code.
          </p>

          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-rounded text-[20px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant tracking-wide">Email Address</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant/30 px-4 py-3 rounded-t-lg focus:ring-0 focus:border-primary transition-colors outline-none font-medium" 
                placeholder="alex@example.com"
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
                  Sending...
                </>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-on-surface-variant">
            Remembered your password?{' '}
            <button onClick={() => navigate('/auth')} className="text-primary font-bold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
