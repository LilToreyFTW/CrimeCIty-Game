import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  [key: string]: any;
}
import { dbGet, dbRun, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, recordCasinoGame } from '@/lib/gameDatabase';

async function authenticateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();

    // Casino games and their odds
    const games = {
      'slots': { winChance: 0.3, multiplier: [1, 5] },
      'blackjack': { winChance: 0.45, multiplier: [1, 2] },
      'poker': { winChance: 0.4, multiplier: [1, 3] },
      'roulette': { winChance: 0.47, multiplier: [1, 36] },
      'dice': { winChance: 0.5, multiplier: [1, 2] },
      'wheel': { winChance: 0.35, multiplier: [1, 10] }
    } as const;

    const { gameType, betAmount } = await request.json();
    const playerData = await getPlayerData(auth.userId);

    // Type-safe access to games object
    const game = games[gameType as keyof typeof games];
    if (!game) {
      return NextResponse.json(
        { error: 'Invalid game type' },
        { status: 400 }
      );
    }

    // Check if player has enough money
    if (playerData.player.money < betAmount) {
      return NextResponse.json(
        { error: `Not enough money. You bet $${betAmount}` },
        { status: 400 }
      );
    }

    // Simulate game
    const won = Math.random() < game.winChance;
    const multiplier = won 
      ? Math.random() * (game.multiplier[1] - game.multiplier[0]) + game.multiplier[0]
      : 0;
    
    const payout = won ? Math.floor(betAmount * multiplier) : 0;
    const netChange = payout - betAmount;

    // Record game
    await recordCasinoGame(auth.userId, gameType, betAmount, won, payout);

    // Update player stats
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money + netChange
      }
    };
    await updatePlayerStats(auth.userId, updates);

    return NextResponse.json({
      message: won ? 'You won!' : 'You lost!',
      result: {
        won,
        betAmount,
        payout,
        netChange,
        gameType
      }
    });
  } catch (error) {
    console.error('Casino error:', error);
    return NextResponse.json(
      { error: 'Casino game failed' },
      { status: 500 }
    );
  }
}
