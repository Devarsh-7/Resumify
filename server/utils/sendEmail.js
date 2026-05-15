const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a verification OTP email to the user.
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit verification code
 */
const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: `"Resumify AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Resumify AI Account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 32px 24px; text-align: center;">
          <div style="width: 48px; height: 48px; background: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; color: #4f46e5; margin-bottom: 16px; line-height: 48px;">R</div>
          <h1 style="color: white; font-size: 22px; margin: 0; font-weight: 700;">Verify Your Email</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0 0;">Welcome to Resumify AI</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px 24px; text-align: center;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Use the verification code below to complete your registration. This code will expire in <strong>10 minutes</strong>.
          </p>
          
          <!-- OTP Code -->
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 0 auto 24px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #1e293b; font-family: monospace;">${code}</span>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
            If you didn't create an account on Resumify AI, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Resumify AI — AI-Powered Resume Analysis</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a password reset OTP email to the user.
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit password reset code
 */
const sendPasswordResetEmail = async (to, code) => {
  const mailOptions = {
    from: `"Resumify AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f43f5e, #e11d48); padding: 32px 24px; text-align: center;">
          <div style="width: 48px; height: 48px; background: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; color: #e11d48; margin-bottom: 16px; line-height: 48px;">R</div>
          <h1 style="color: white; font-size: 22px; margin: 0; font-weight: 700;">Reset Your Password</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0 0;">Resumify AI Security</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px 24px; text-align: center;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset your password. Use the code below to set a new password. This code will expire in <strong>10 minutes</strong>.
          </p>
          
          <!-- OTP Code -->
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 0 auto 24px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #1e293b; font-family: monospace;">${code}</span>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
            If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Resumify AI — AI-Powered Resume Analysis</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
