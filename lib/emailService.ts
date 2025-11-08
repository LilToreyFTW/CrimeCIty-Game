import nodemailer from 'nodemailer';
import crypto from 'crypto';

const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

let transporter: nodemailer.Transporter | null = null;
try {
  transporter = nodemailer.createTransport(emailConfig);
} catch (error) {
  console.warn('Email service not configured. Running in development mode.');
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationToken: string,
  baseUrl: string
) {
  try {
    if (!transporter) {
      console.log('Email service not available. Skipping email send.');
      return { success: true, messageId: 'dev-mode' };
    }

    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Crime City" <${emailConfig.auth.user}>`,
      to: email,
      subject: '🔐 Verify Your Crime City Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Account - Crime City</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #2a2a2a; padding: 40px; border-radius: 10px;">
            <h1 style="color: #ff6b35;">🔐 Crime City</h1>
            <h2>Account Verification Required</h2>
            <p>Welcome to Crime City, <strong>${username}</strong>!</p>
            <p>Click the button below to verify your account:</p>
            <a href="${verificationLink}" style="display: inline-block; background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Verify My Account
            </a>
            <p>Or copy this link: <a href="${verificationLink}" style="color: #ff6b35;">${verificationLink}</a></p>
            <p style="color: #ccc; font-size: 12px;">This link expires in 24 hours.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendResendVerificationEmail(
  email: string,
  username: string,
  verificationToken: string,
  baseUrl: string
) {
  return sendVerificationEmail(email, username, verificationToken, baseUrl);
}
