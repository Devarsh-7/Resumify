const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');
const { logSecurityEvent } = require('../utils/logger');
const { sanitizeString } = require('../utils/sanitizeInput');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateOTP = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV ONLY] Generated OTP: ${code}`);
  }
  return code;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const signup = async (req, res) => {
  try {
    const name = sanitizeString(req.body.name || '');
    const email = sanitizeString((req.body.email || '').toLowerCase());
    const password = req.body.password || '';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (name.length > 100) {
      return res.status(400).json({ message: 'Name must not exceed 100 characters' });
    }

    if (email.length > 255 || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 6 and 128 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        const code = generateOTP();
        existingUser.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
        existingUser.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
        await existingUser.save();

        sendVerificationEmail(email, code).catch(err => 
          console.error('Signup resend verification email error:', err.message)
        );
        return res.status(200).json({ 
          message: 'Verification code resent to your email', 
          email,
          needsVerification: true 
        });
      }
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const code = generateOTP();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.create({ 
      name, 
      email, 
      password,
      isVerified: false,
      verificationCode: hashedCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000,
    });

    sendVerificationEmail(email, code).catch(err => 
      console.error('Signup send verification email error:', err.message)
    );

    res.status(201).json({
      message: 'Account created! Please check your email for the verification code.',
      email,
      needsVerification: true,
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Please provide email and verification code' });
    }

    const user = await User.findOne({ email }).select('+verificationCode');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const a = Buffer.from(hashedCode, 'hex');
    const b = user.verificationCode ? Buffer.from(user.verificationCode, 'hex') : Buffer.alloc(0);
    
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify email error:', error.message);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

const resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const code = generateOTP();
    user.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    sendVerificationEmail(email, code).catch(err => 
      console.error('Resend verification email error:', err.message)
    );

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend code error:', error.message);
    res.status(500).json({ message: 'Server error resending verification code' });
  }
};

const login = async (req, res) => {
  try {
    const email = sanitizeString((req.body.email || '').toLowerCase());
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (email.length > 255 || !isValidEmail(email) || password.length > 128) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logSecurityEvent('AUTH_FAILURE', { ip: req.ip, user: email, path: req.originalUrl, method: req.method, status: 401, message: 'Invalid credentials - user not found' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please click "Continue with Google" instead.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logSecurityEvent('AUTH_FAILURE', { ip: req.ip, user: email, path: req.originalUrl, method: req.method, status: 401, message: 'Invalid credentials - incorrect password' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isVerified === false) {
      const code = generateOTP();
      user.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
      user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      sendVerificationEmail(email, code).catch(err => 
        console.error('Login auto-resend verification email error:', err.message)
      );

      return res.status(403).json({ 
        message: 'Please verify your email first. A new verification code has been sent.',
        needsVerification: true,
        email,
      });
    }

    logSecurityEvent('AUTH_SUCCESS', { ip: req.ip, user: user._id, path: req.originalUrl, method: req.method, status: 200, message: 'Successful password authentication' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        careerDefaults: user.careerDefaults,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name ? sanitizeString(req.body.name) : user.name;

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.careerDefaults) {
        const { targetRole, industry, experienceLevel } = req.body.careerDefaults;
        user.careerDefaults = {
          targetRole: targetRole !== undefined ? sanitizeString(targetRole) : user.careerDefaults?.targetRole,
          industry: industry !== undefined ? sanitizeString(industry) : user.careerDefaults?.industry,
          experienceLevel: experienceLevel !== undefined ? sanitizeString(experienceLevel) : user.careerDefaults?.experienceLevel,
        };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        careerDefaults: updatedUser.careerDefaults,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (user.authProvider === 'local' && !user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        user.isVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        authProvider: 'google',
        isVerified: true,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const Analysis = require('../models/Analysis');
    const Resume = require('../models/Resume');

    await Analysis.deleteMany({ user: req.user._id });
    await Resume.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account and all associated data have been permanently deleted.' });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ message: 'Server error while deleting account' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, we sent a password reset link.' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: 'This account uses Google Sign-In. You cannot reset its password here.' });
    }

    const code = generateOTP();
    user.resetPasswordCode = crypto.createHash('sha256').update(code).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const { sendPasswordResetEmail } = require('../utils/sendEmail');
    sendPasswordResetEmail(email, code).catch(err => 
      console.error('Send password reset email error:', err.message)
    );

    res.json({ message: 'If an account with that email exists, we sent a password reset link.' });
  } catch (error) {
    console.error('Request password reset error:', error.message);
    res.status(500).json({ message: 'Server error requesting password reset' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, verification code, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+resetPasswordCode');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Password reset code has expired. Please request a new one.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const a = Buffer.from(hashedCode, 'hex');
    const b = user.resetPasswordCode ? Buffer.from(user.resetPasswordCode, 'hex') : Buffer.alloc(0);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = { signup, login, googleLogin, verifyEmail, resendCode, getMe, updateProfile, deleteAccount, requestPasswordReset, resetPassword };
