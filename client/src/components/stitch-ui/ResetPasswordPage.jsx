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
    <div className="min-h-screen flex text-on-surface font-body w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-highest relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-on-primary font-bold text-4xl mb-8 shadow-2xl shadow-primary/30 mx-auto">R</div>
          <h2 className="text-4xl font-headline font-black mb-4">Set a New Password</h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Enter the 6-digit code we sent to your email, along with your new password to regain access to your account.
          </p>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="w-full lg:w-1/2 bg-surface flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold text-xl mb-8">R</div>

          {success ? (
            // Success State
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-rounded text-green-600 text-4xl">check_circle</span>
              </div>
              <h1 className="text-3xl font-headline font-bold mb-2">Password Reset!</h1>
              <p className="text-on-surface-variant mb-4">Your password has been successfully updated. Redirecting you to login...</p>
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            // Reset Form
            <>
              <h1 className="text-3xl font-headline font-bold mb-2">Reset Password</h1>
              <p className="text-on-surface-variant mb-2 font-medium">
                Enter the 6-digit code sent to
              </p>
              <p className="text-primary font-bold mb-8 truncate">{email}</p>

              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-rounded text-[20px]">error</span>
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
                      ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/30 bg-surface-container-lowest'}
                      focus:border-primary focus:ring-2 focus:ring-primary/20`}
                  />
                ))}
              </div>

              {/* New Password Input */}
              <div className="space-y-1.5 mb-8">
                <label className="text-sm font-bold text-on-surface-variant tracking-wide">New Password</label>
                <input 
                  type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant/30 px-4 py-3 rounded-t-lg focus:ring-0 focus:border-primary transition-colors outline-none font-medium" 
                  placeholder="••••••••"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                disabled={loading || code.join('').length !== 6 || newPassword.length < 6}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <p className="mt-10 text-center text-sm font-medium text-on-surface-variant">
                Wrong email?{' '}
                <button onClick={() => navigate('/auth')} className="text-primary font-bold hover:underline">
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
