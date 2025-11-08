import { NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const verification = await dbGet(
      'SELECT * FROM email_verifications WHERE verification_token = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    await dbRun(
      'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      [verification.user_id]
    );

    await dbRun(
      'UPDATE email_verifications SET is_used = 1, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
      [verification.id]
    );

    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [verification.user_id]);

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 500 }
    );
  }
}
