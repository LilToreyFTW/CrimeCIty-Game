import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet, ensureDatabase } from '@/lib/database';
import { detectVPN, checkIPHistory } from '@/lib/ipUtils';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/emailService';
import { initializePlayerData } from '@/lib/gameDatabase';

export async function POST(request) {
  try {
    await ensureDatabase();
    const { email, password, username, dateOfBirth } = await request.json();
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validation
    if (!email || !password || !username || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Email, password, username, and date of birth are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate date of birth format (MM/DD/YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return NextResponse.json(
        { error: 'Date of birth must be in MM/DD/YYYY format (e.g., 02/08/1999)' },
        { status: 400 }
      );
    }

    // Validate date and check age
    const [month, day, year] = dateOfBirth.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return NextResponse.json(
        { error: 'Invalid date. Please enter a valid date.' },
        { status: 400 }
      );
    }
    
    if (birthDate > today) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future' },
        { status: 400 }
      );
    }
    
    const age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const dayDiff = today.getDate() - day;
    
    if (age < 13 || (age === 13 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      return NextResponse.json(
        { error: 'You must be at least 13 years old to register' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Check IP history
    const ipHistory = await checkIPHistory(clientIP);
    if (ipHistory.length > 0) {
      return NextResponse.json(
        { 
          error: 'An account already exists from this IP address. Only one account per IP is allowed.',
          existingAccounts: ipHistory.length
        },
        { status: 400 }
      );
    }

    // Detect VPN/Proxy
    const vpnInfo = await detectVPN(clientIP);
    
    if (vpnInfo.isVpn && !vpnInfo.isMetered) {
      return NextResponse.json(
        { 
          error: 'VPN connections are not allowed for registration',
          vpnInfo: vpnInfo,
          message: 'Only metered connections (mobile/hotspot) are allowed with VPN'
        },
        { status: 400 }
      );
    }

    if (vpnInfo.isProxy) {
      return NextResponse.json(
        { 
          error: 'Proxy connections are not allowed for registration',
          vpnInfo: vpnInfo
        },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

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
      [clientIP, result.lastID, vpnInfo.isVpn ? 1 : 0, vpnInfo.isProxy ? 1 : 0, vpnInfo.country, vpnInfo.region, vpnInfo.city]
    );

    // Track metered connection if applicable
    if (vpnInfo.isMetered) {
      await dbRun(
        `INSERT INTO metered_connections (user_id, ip_address, is_metered, connection_type) 
         VALUES (?, ?, ?, ?)`,
        [result.lastID, clientIP, 1, vpnInfo.provider]
      );
    }

    // Send verification email
    const baseUrl = process.env.BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const emailResult = await sendVerificationEmail(email, username, verificationToken, baseUrl);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
    }

    // Store verification record
    await dbRun(
      `INSERT INTO email_verifications (user_id, email, verification_token, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [result.lastID, email, verificationToken, verificationExpires.toISOString()]
    );

    // Initialize player game data
    await initializePlayerData(result.lastID);

    return NextResponse.json({
      message: 'Account created successfully. Please check your email for verification link.',
      emailSent: emailResult.success,
      user: {
        id: result.lastID,
        email,
        username,
        isVerified: false
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}