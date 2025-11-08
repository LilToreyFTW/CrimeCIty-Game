import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet, dbAll } from '../database/init.js';
import { detectVPN, checkIPHistory, checkMeteredConnection } from '../utils/ipUtils.js';
import { generateVerificationToken, sendVerificationEmail, sendResendVerificationEmail } from '../utils/emailService.js';

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, dateOfBirth } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validation
    if (!email || !password || !username || !dateOfBirth) {
      return res.status(400).json({ error: 'Email, password, username, and date of birth are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate date of birth format (MM/DD/YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({ error: 'Date of birth must be in MM/DD/YYYY format (e.g., 02/08/1999)' });
    }

    // Validate date and check age
    const [month, day, year] = dateOfBirth.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Check if date is valid
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return res.status(400).json({ error: 'Invalid date. Please enter a valid date.' });
    }
    
    // Check if date is not in the future
    if (birthDate > today) {
      return res.status(400).json({ error: 'Date of birth cannot be in the future' });
    }
    
    // Check if user is at least 13 years old
    const age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const dayDiff = today.getDate() - day;
    
    if (age < 13 || (age === 13 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      return res.status(400).json({ error: 'You must be at least 13 years old to register' });
    }

    // Check if email already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check IP history for existing accounts
    const ipHistory = await checkIPHistory(clientIP);
    if (ipHistory.length > 0) {
      return res.status(400).json({ 
        error: 'An account already exists from this IP address. Only one account per IP is allowed.',
        existingAccounts: ipHistory.length
      });
    }

    // Detect VPN/Proxy
    const vpnInfo = await detectVPN(clientIP);
    
    // Check if it's a metered connection (mobile/hotspot) - these are allowed
    if (vpnInfo.isVpn && !vpnInfo.isMetered) {
      return res.status(400).json({ 
        error: 'VPN connections are not allowed for registration',
        vpnInfo: vpnInfo,
        message: 'Only metered connections (mobile/hotspot) are allowed with VPN'
      });
    }

    if (vpnInfo.isProxy) {
      return res.status(400).json({ 
        error: 'Proxy connections are not allowed for registration',
        vpnInfo: vpnInfo
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Create user
    const result = await dbRun(
      `INSERT INTO users (email, password_hash, username, date_of_birth, ip_address, user_agent, verification_token, verification_expires) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, username, dateOfBirth, clientIP, userAgent, verificationToken, verificationExpires.toISOString()]
    );

    // Track IP
    await dbRun(
      `INSERT INTO ip_tracking (ip_address, user_id, is_vpn, is_proxy, country, region, city) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientIP, result.lastID, vpnInfo.isVpn, vpnInfo.isProxy, vpnInfo.country, vpnInfo.region, vpnInfo.city]
    );

    // Track metered connection if applicable
    if (vpnInfo.isMetered) {
      await dbRun(
        `INSERT INTO metered_connections (user_id, ip_address, is_metered, connection_type) 
         VALUES (?, ?, ?, ?)`,
        [result.lastID, clientIP, vpnInfo.isMetered, vpnInfo.provider]
      );
    }

    // Send verification email
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const emailResult = await sendVerificationEmail(email, username, verificationToken, baseUrl);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success but warn about email
    }

    // Store verification record
    await dbRun(
      `INSERT INTO email_verifications (user_id, email, verification_token, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [result.lastID, email, verificationToken, verificationExpires.toISOString()]
    );

    res.status(201).json({
      message: 'Account created successfully. Please check your email for verification link.',
      emailSent: emailResult.success,
      user: {
        id: result.lastID,
        email,
        username,
        isVerified: false
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await dbRun(
        'INSERT INTO login_attempts (ip_address, email, success, user_agent) VALUES (?, ?, ?, ?)',
        [clientIP, email, false, userAgent]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await dbRun(
        'INSERT INTO login_attempts (ip_address, email, success, user_agent) VALUES (?, ?, ?, ?)',
        [clientIP, email, false, userAgent]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please check your email and click the verification link to activate your account.',
        needsVerification: true
      });
    }

    // Detect VPN/Proxy
    const vpnInfo = await detectVPN(clientIP);
    
    // Check metered connection enforcement
    const meteredCheck = await checkMeteredConnection(user.id, clientIP);
    if (!meteredCheck.isAllowed) {
      return res.status(403).json({
        error: 'Metered connection violation',
        warning: meteredCheck.message,
        details: {
          registeredIP: meteredCheck.registeredIP,
          currentIP: meteredCheck.currentIP
        }
      });
    }
    
    // Check for IP changes and VPN usage
    if (user.ip_address !== clientIP) {
      // Check if this IP is associated with other accounts
      const otherAccounts = await dbAll(
        'SELECT username, created_at FROM users WHERE ip_address = ? AND id != ?',
        [clientIP, user.id]
      );

      if (otherAccounts.length > 0) {
        return res.status(403).json({
          error: 'This IP address is already associated with another account',
          warning: 'Multiple accounts from the same IP are not allowed',
          existingAccounts: otherAccounts
        });
      }

      // Check for VPN usage - allow metered connections
      if (vpnInfo.isVpn && !vpnInfo.isMetered) {
        return res.status(403).json({
          error: 'VPN connections are not allowed',
          warning: 'Only metered connections (mobile/hotspot) are allowed with VPN',
          vpnInfo: vpnInfo
        });
      }

      if (vpnInfo.isProxy) {
        return res.status(403).json({
          error: 'Proxy connections are not allowed',
          warning: 'Please disable your proxy and try again',
          vpnInfo: vpnInfo
        });
      }

      // Update user's IP
      await dbRun(
        'UPDATE users SET ip_address = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [clientIP, user.id]
      );
    }

    // Record successful login
    await dbRun(
      'INSERT INTO login_attempts (ip_address, email, success, user_agent, is_vpn) VALUES (?, ?, ?, ?, ?)',
      [clientIP, email, true, userAgent, vpnInfo.isVpn]
    );

    // Update last login
    await dbRun(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id, email, username, is_active, is_verified FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ user: { id: user.id, email: user.email, username: user.username, isVerified: user.is_verified } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find verification record
    const verification = await dbGet(
      'SELECT * FROM email_verifications WHERE verification_token = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user as verified
    await dbRun(
      'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      [verification.user_id]
    );

    // Mark verification as used
    await dbRun(
      'UPDATE email_verifications SET is_used = 1, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
      [verification.id]
    );

    // Get user info
    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [verification.user_id]);

    res.json({
      message: 'Email verified successfully! You can now log in to your account.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Update user with new token
    await dbRun(
      'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires.toISOString(), user.id]
    );

    // Invalidate old verification records
    await dbRun(
      'UPDATE email_verifications SET is_used = 1 WHERE user_id = ? AND is_used = 0',
      [user.id]
    );

    // Create new verification record
    await dbRun(
      'INSERT INTO email_verifications (user_id, email, verification_token, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, email, verificationToken, verificationExpires.toISOString()]
    );

    // Send verification email
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const emailResult = await sendResendVerificationEmail(email, user.username, verificationToken, baseUrl);

    res.json({
      message: 'New verification email sent. Please check your email.',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

export default router;
