import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet } from '@/lib/database';
import { detectVPN, checkMeteredConnection } from '@/lib/ipUtils';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await dbRun(
        'INSERT INTO login_attempts (ip_address, email, success, user_agent) VALUES (?, ?, ?, ?)',
        [clientIP, email, 0, userAgent]
      );
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await dbRun(
        'INSERT INTO login_attempts (ip_address, email, success, user_agent) VALUES (?, ?, ?, ?)',
        [clientIP, email, 0, userAgent]
      );
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    if (!user.is_verified) {
      return NextResponse.json(
        { 
          error: 'Email not verified',
          message: 'Please check your email and click the verification link to activate your account.',
          needsVerification: true
        },
        { status: 403 }
      );
    }

    const vpnInfo = await detectVPN(clientIP);
    const meteredCheck = await checkMeteredConnection(user.id, clientIP);
    
    if (!meteredCheck.isAllowed) {
      return NextResponse.json(
        {
          error: 'Metered connection violation',
          warning: meteredCheck.message,
          details: {
            registeredIP: meteredCheck.registeredIP,
            currentIP: meteredCheck.currentIP
          }
        },
        { status: 403 }
      );
    }

    if (user.ip_address !== clientIP) {
      const otherAccounts = await dbGet(
        'SELECT username, created_at FROM users WHERE ip_address = ? AND id != ?',
        [clientIP, user.id]
      );

      if (otherAccounts) {
        return NextResponse.json(
          {
            error: 'This IP address is already associated with another account',
            warning: 'Multiple accounts from the same IP are not allowed'
          },
          { status: 403 }
        );
      }

      if (vpnInfo.isVpn && !vpnInfo.isMetered) {
        return NextResponse.json(
          {
            error: 'VPN connections are not allowed',
            warning: 'Only metered connections (mobile/hotspot) are allowed with VPN',
            vpnInfo: vpnInfo
          },
          { status: 403 }
        );
      }

      if (vpnInfo.isProxy) {
        return NextResponse.json(
          {
            error: 'Proxy connections are not allowed',
            warning: 'Please disable your proxy and try again',
            vpnInfo: vpnInfo
          },
          { status: 403 }
        );
      }

      await dbRun(
        'UPDATE users SET ip_address = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [clientIP, user.id]
      );
    }

    await dbRun(
      'INSERT INTO login_attempts (ip_address, email, success, user_agent, is_vpn) VALUES (?, ?, ?, ?, ?)',
      [clientIP, email, 1, userAgent, vpnInfo.isVpn ? 1 : 0]
    );

    await dbRun(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
