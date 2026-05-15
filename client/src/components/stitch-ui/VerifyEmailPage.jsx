import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useContext(AuthContext);
  const email = location.state?.email;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/auth');
    }
  }, [email, navigate]);

  // OTP expiry countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

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

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyEmail(email, fullCode);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post('/auth/resend-code', { email });
      setResendCooldown(60); // 60 second cooldown
      setTimer(600); // Reset the 10 min timer
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex text-on-surface font-body w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-highest relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-on-primary font-bold text-4xl mb-8 shadow-2xl shadow-primary/30 mx-auto">R</div>
          <h2 className="text-4xl font-headline font-black mb-4">Almost there!</h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            We've sent a verification code to your email. Enter it to complete your registration and start analyzing resumes.
          </p>

          <div className="mt-12 bg-surface-container-lowest/50 backdrop-blur rounded-2xl p-8 border border-white/20 text-left">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-rounded text-primary text-2xl">mail</span>
              <div>
                <p className="font-bold text-sm">Code sent to</p>
                <p className="text-on-surface-variant text-sm">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-primary text-2xl">timer</span>
              <div>
                <p className="font-bold text-sm">Expires in</p>
                <p className={`text-sm font-mono font-bold ${timer < 60 ? 'text-red-500' : 'text-on-surface-variant'}`}>
                  {timer > 0 ? formatTime(timer) : 'Expired'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Verification Form */}
      <div className="w-full lg:w-1/2 bg-surface flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold text-xl mb-8">R</div>

          {success ? (
            // Success State
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-rounded text-green-600 text-4xl">check_circle</span>
              </div>
              <h1 className="text-3xl font-headline font-bold mb-2">Email Verified!</h1>
              <p className="text-on-surface-variant mb-4">Redirecting you to the dashboard...</p>
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            // Verification Form
            <>
              <h1 className="text-3xl font-headline font-bold mb-2">Verify Your Email</h1>
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
              <div className="flex gap-3 mb-8 justify-center" onPaste={handlePaste}>
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

              {/* Timer (mobile) */}
              <div className="lg:hidden text-center mb-6">
                <p className={`text-sm font-mono font-bold ${timer < 60 ? 'text-red-500' : 'text-on-surface-variant'}`}>
                  {timer > 0 ? `Code expires in ${formatTime(timer)}` : 'Code expired'}
                </p>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={loading || code.join('').length !== 6}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>

              {/* Resend */}
              <div className="mt-8 text-center">
                <p className="text-sm text-on-surface-variant mb-2">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-primary font-bold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

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

export default VerifyEmailPage;
