const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token valid for 30 days
  });
};

// Helper: Generate a 6-digit OTP
const generateOTP = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[DEVELOPER DEV ONLY] Generated OTP: ${code}`);
  return code;
};

// Helper: Validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// @desc    Register a new user
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but isn't verified, resend verification
      if (!existingUser.isVerified) {
        const code = generateOTP();
        existingUser.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
        existingUser.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min
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

    // Generate OTP
    const code = generateOTP();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Create new user (password gets hashed by the pre-save hook)
    const user = await User.create({ 
      name, 
      email, 
      password,
      isVerified: false,
      verificationCode: hashedCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send verification email in the background
    sendVerificationEmail(email, code).catch(err => 
      console.error('Signup send verification email error:', err.message)
    );

    // Don't send token yet — user must verify first
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

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Please provide email and verification code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Check expiry
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Compare hashed code
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Mark as verified and clear code
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Now send back user info + token
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

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
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

    // Generate new OTP
    const code = generateOTP();
    user.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min
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

// @desc    Login existing user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Block email login for Google-only accounts
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please click "Continue with Google" instead.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is verified (skip for legacy users who don't have the field)
    if (user.isVerified === false) {
      // Resend a new code automatically
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

    // Send back user info + token
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

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
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

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      // Email change is blocked — would bypass verification flow

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.careerDefaults) {
        const { targetRole, industry, experienceLevel } = req.body.careerDefaults;
        user.careerDefaults = {
          targetRole: targetRole !== undefined ? targetRole : user.careerDefaults?.targetRole,
          industry: industry !== undefined ? industry : user.careerDefaults?.industry,
          experienceLevel: experienceLevel !== undefined ? experienceLevel : user.careerDefaults?.experienceLevel,
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

// @desc    Login/Register with Google
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists — link Google if they signed up with email before
      if (user.authProvider === 'local' && !user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        user.isVerified = true; // Google verifies email
        await user.save();
      }
    } else {
      // Create new user (no password needed)
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        authProvider: 'google',
        isVerified: true, // Google already verified
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

// @desc    Delete user account and all associated data
// @route   DELETE /api/auth/account
const deleteAccount = async (req, res) => {
  try {
    const Analysis = require('../models/Analysis');

    // Delete all analyses belonging to this user
    await Analysis.deleteMany({ user: req.user._id });

    // Delete the user
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account and all associated data have been permanently deleted.' });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ message: 'Server error while deleting account' });
  }
};

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 even if user doesn't exist to prevent email enumeration
      return res.status(200).json({ message: 'If an account with that email exists, we sent a password reset link.' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: 'This account uses Google Sign-In. You cannot reset its password here.' });
    }

    // Generate new OTP
    const code = generateOTP();
    user.resetPasswordCode = crypto.createHash('sha256').update(code).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min
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

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, verification code, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check expiry
    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Password reset code has expired. Please request a new one.' });
    }

    // Compare hashed code
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.resetPasswordCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Set new password and clear reset fields
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
