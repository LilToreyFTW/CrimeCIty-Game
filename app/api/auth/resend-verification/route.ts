import { NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/database';
import { generateVerificationToken, sendResendVerificationEmail } from '@/lib/emailService';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.is_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await dbRun(
      'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires.toISOString(), user.id]
    );

    await dbRun(
      'UPDATE email_verifications SET is_used = 1 WHERE user_id = ? AND is_used = 0',
      [user.id]
    );

    await dbRun(
      'INSERT INTO email_verifications (user_id, email, verification_token, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, email, verificationToken, verificationExpires.toISOString()]
    );

    const baseUrl = process.env.BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const emailResult = await sendResendVerificationEmail(email, user.username, verificationToken, baseUrl);

    return NextResponse.json({
      message: 'New verification email sent. Please check your email.',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
