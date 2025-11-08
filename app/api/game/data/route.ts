import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '@/lib/database';

// Middleware to verify JWT token
async function authenticateToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

export async function GET(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [auth.userId]);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const gameData = user.game_data ? JSON.parse(user.game_data) : null;
    return NextResponse.json({ gameData });
  } catch (error) {
    console.error('Get game data error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve game data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { gameData } = await request.json();
    
    if (!gameData) {
      return NextResponse.json(
        { error: 'Game data is required' },
        { status: 400 }
      );
    }

    const enhancedGameData = {
      ...gameData,
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };

    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(enhancedGameData), auth.userId]
    );

    return NextResponse.json({ 
      message: 'Game data saved successfully',
      timestamp: enhancedGameData.lastSaved
    });
  } catch (error) {
    console.error('Save game data error:', error);
    return NextResponse.json(
      { error: 'Failed to save game data' },
      { status: 500 }
    );
  }
}
