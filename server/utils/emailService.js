import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter (with fallback for development)
let transporter;
try {
  transporter = nodemailer.createTransport(emailConfig);
} catch (error) {
  console.warn('Email service not configured. Running in development mode.');
  transporter = null;
}

// Generate verification token
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(email, username, verificationToken, baseUrl) {
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account - Crime City</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              margin: 0;
              padding: 20px;
              color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
              border: 2px solid #444;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 2.5rem;
              color: #ff6b35;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }
            .title {
              font-size: 1.8rem;
              color: #fff;
              margin-bottom: 20px;
            }
            .content {
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(145deg, #ff6b35, #e55a2b);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 1.1rem;
              text-align: center;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
              transition: all 0.3s ease;
            }
            .verify-button:hover {
              background: linear-gradient(145deg, #e55a2b, #d14a1b);
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
            }
            .warning {
              background: rgba(255, 107, 53, 0.1);
              border: 1px solid #ff6b35;
              border-radius: 10px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #ccc;
              font-size: 0.9rem;
            }
            .link {
              color: #ff6b35;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 Crime City</div>
              <h1 class="title">Account Verification Required</h1>
            </div>
            
            <div class="content">
              <p>Welcome to Crime City, <strong>${username}</strong>!</p>
              
              <p>Your account has been created successfully, but you need to verify your email address before you can access the game.</p>
              
              <p>Click the button below to verify your account and start your criminal journey:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="verify-button">
                  🚀 Verify My Account
                </a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours for security reasons.
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${verificationLink}" class="link">${verificationLink}</a></p>
              
              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>🎮 Access the full game</li>
                <li>💰 Start earning money</li>
                <li>🏆 Build your criminal empire</li>
                <li>👥 Join or create factions</li>
                <li>🏁 Participate in races</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
              <p>© 2024 Crime City - The Ultimate Criminal Experience</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: error.message };
  }
}

// Send resend verification email
export async function sendResendVerificationEmail(email, username, verificationToken, baseUrl) {
  try {
    if (!transporter) {
      console.log('Email service not available. Skipping email send.');
      return { success: true, messageId: 'dev-mode' };
    }

    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Crime City" <${emailConfig.auth.user}>`,
      to: email,
      subject: '🔄 New Verification Link - Crime City',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Verification Link - Crime City</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              margin: 0;
              padding: 20px;
              color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
              border: 2px solid #444;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 2.5rem;
              color: #ff6b35;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }
            .title {
              font-size: 1.8rem;
              color: #fff;
              margin-bottom: 20px;
            }
            .content {
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(145deg, #ff6b35, #e55a2b);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 1.1rem;
              text-align: center;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            }
            .info {
              background: rgba(0, 123, 255, 0.1);
              border: 1px solid #007bff;
              border-radius: 10px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #ccc;
              font-size: 0.9rem;
            }
            .link {
              color: #ff6b35;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔄 Crime City</div>
              <h1 class="title">New Verification Link</h1>
            </div>
            
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              
              <p>You requested a new verification link for your Crime City account.</p>
              
              <div class="info">
                <strong>ℹ️ Note:</strong> Your previous verification link has been invalidated. Use this new link to verify your account.
              </div>
              
              <p>Click the button below to verify your account:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="verify-button">
                  🔐 Verify My Account
                </a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${verificationLink}" class="link">${verificationLink}</a></p>
              
              <p>This verification link will expire in 24 hours.</p>
            </div>
            
            <div class="footer">
              <p>If you didn't request this new verification link, please ignore this email.</p>
              <p>© 2024 Crime City - The Ultimate Criminal Experience</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Resend verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send resend verification email:', error);
    return { success: false, error: error.message };
  }
}

// Test email configuration
export async function testEmailConnection() {
  try {
    if (!transporter) {
      console.log('Email service not configured');
      return false;
    }
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
}
