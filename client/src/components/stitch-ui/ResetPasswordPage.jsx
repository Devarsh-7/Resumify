import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useContext(AuthContext);
  const email = location.state?.email;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move back on backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleReset = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(email, fullCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/auth', { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-body w-full transition-colors duration-300">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden flex-col items-center justify-center p-12 transition-colors">
        <div className="absolute inset-0 bg-blue-600/5"></div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mb-8 shadow-2xl shadow-blue-500/30 mx-auto">R</div>
          <h2 className="text-4xl font-headline font-black mb-4 text-slate-900 dark:text-white">Set a New Password</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Enter the 6-digit code we sent to your email, along with your new password to regain access to your account.
          </p>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center px-8 sm:px-16 lg:px-24 transition-colors">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-8">R</div>

          {success ? (
            // Success State
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-rounded text-green-600 dark:text-green-400 text-4xl">check_circle</span>
              </div>
              <h1 className="text-3xl font-headline font-bold mb-2 text-slate-900 dark:text-white">Password Reset!</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Your password has been successfully updated. Redirecting you to login...</p>
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            // Reset Form
            <>
              <h1 className="text-3xl font-headline font-bold mb-2 text-slate-900 dark:text-white">Reset Password</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">
                Enter the 6-digit code sent to
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-bold mb-8 truncate">{email}</p>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-rounded text-[20px] text-red-500">error</span>
                  {error}
                </div>
              )}

              {/* OTP Input */}
              <div className="flex gap-3 mb-6 justify-center" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all
                      ${digit ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'}
                      focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20`}
                  />
                ))}
              </div>

              {/* New Password Input */}
              <div className="space-y-1.5 mb-8">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide">New Password</label>
                <input 
                  type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-0 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-t-lg focus:ring-0 focus:border-blue-600 dark:focus:border-blue-400 transition-colors outline-none font-medium" 
                  placeholder="••••••••"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                disabled={loading || code.join('').length !== 6 || newPassword.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-950/60 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              {/* Back to Login */}
              <p className="mt-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                Wrong email?{' '}
                <button onClick={() => navigate('/auth')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Go back
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
