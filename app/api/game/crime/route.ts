import { NextResponse, NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  userId: string;
  [key: string]: any;
};
import { dbGet, dbRun, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, recordCrime } from '@/lib/gameDatabase';

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
    
    const { crimeType } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    // Crime types and their properties
    const crimes = {
      shoplifting: { risk: 0.3, reward: [50, 200], energy: 10 },
      pickpocketing: { risk: 0.4, reward: [30, 150], energy: 15 },
      burglary: { risk: 0.6, reward: [200, 800], energy: 25 },
      robbery: { risk: 0.7, reward: [500, 1500], energy: 35 },
      heist: { risk: 0.8, reward: [2000, 5000], energy: 50 }
    };

    const crime = crimes[crimeType];
    if (!crime) {
      return NextResponse.json(
        { error: 'Invalid crime type' },
        { status: 400 }
      );
    }

    // Check cooldown
    if (playerData.cooldowns.crime > Date.now()) {
      return NextResponse.json(
        { error: `Crime cooldown active. Wait ${Math.ceil((playerData.cooldowns.crime - Date.now()) / 1000)} seconds` },
        { status: 400 }
      );
    }

    // Check energy
    if (playerData.player.energy < crime.energy) {
      return NextResponse.json(
        { error: `Not enough energy. Need ${crime.energy} energy for ${crimeType}.` },
        { status: 400 }
      );
    }

    // Simulate crime
    const isSuccess = Math.random() > crime.risk;
    const isArrested = !isSuccess && Math.random() < crime.risk * 0.5;
    const escaped = isArrested && Math.random() < 0.3; // 30% chance to escape
    
    let reward = 0;
    if (isSuccess) {
      reward = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0] + 1)) + crime.reward[0];
    }

    // Record crime
    await recordCrime(
      auth.userId,
      crimeType,
      isSuccess,
      isArrested && !escaped,
      escaped,
      reward,
      crime.energy,
      crime.risk < 0.5 ? 'low' : crime.risk < 0.7 ? 'medium' : 'high'
    );

    // Update player stats
    const updates = {
      player: {
        ...playerData.player,
        energy: Math.max(0, playerData.player.energy - crime.energy),
        money: playerData.player.money + reward,
        life: isArrested && !escaped ? Math.max(0, playerData.player.life - 20) : playerData.player.life
      }
    };

    await updatePlayerStats(auth.userId, updates);

    // Set cooldown (3 minutes)
    await dbRun(
      'UPDATE player_cooldowns SET crime = ? WHERE user_id = ?',
      [Date.now() + 180000, auth.userId]
    );

    // If arrested, create jail sentence
    if (isArrested && !escaped) {
      const sentenceLength = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
      await dbRun(
        'INSERT INTO jail_sentences (user_id, sentence_length, reason) VALUES (?, ?, ?)',
        [auth.userId, sentenceLength, `Arrested for ${crimeType}`]
      );
    }

    return NextResponse.json({
      message: isSuccess ? 'Crime successful!' : isArrested ? 'Arrested!' : 'Crime failed!',
      result: {
        success: isSuccess,
        arrested: isArrested && !escaped,
        escaped,
        reward,
        energyCost: crime.energy
      }
    });
  } catch (error) {
    console.error('Crime error:', error);
    return NextResponse.json(
      { error: 'Crime failed' },
      { status: 500 }
    );
  }
}


