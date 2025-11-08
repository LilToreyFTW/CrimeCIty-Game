import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats } from '@/lib/gameDatabase';

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

export async function POST(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { treatmentType } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    // Treatment types and costs
    const treatments = {
      'basic': { cost: 100, lifeRestored: 25 },
      'standard': { cost: 250, lifeRestored: 50 },
      'premium': { cost: 500, lifeRestored: 100 },
      'emergency': { cost: 1000, lifeRestored: 100 }
    };

    const treatment = treatments[treatmentType];
    if (!treatment) {
      return NextResponse.json(
        { error: 'Invalid treatment type' },
        { status: 400 }
      );
    }

    // Check if player has enough money
    if (playerData.player.money < treatment.cost) {
      return NextResponse.json(
        { error: `Not enough money. Treatment costs $${treatment.cost}` },
        { status: 400 }
      );
    }

    // Check cooldown
    if (playerData.cooldowns.hospital > Date.now()) {
      return NextResponse.json(
        { error: `Hospital cooldown active. Wait ${Math.ceil((playerData.cooldowns.hospital - Date.now()) / 1000)} seconds` },
        { status: 400 }
      );
    }

    // Record visit
    await dbRun(
      'INSERT INTO hospital_visits (user_id, treatment_type, cost, life_restored) VALUES (?, ?, ?, ?)',
      [auth.userId, treatmentType, treatment.cost, treatment.lifeRestored]
    );

    // Update player stats
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money - treatment.cost,
        life: Math.min(100, playerData.player.life + treatment.lifeRestored)
      }
    };
    await updatePlayerStats(auth.userId, updates);

    // Set cooldown (5 minutes)
    await dbRun(
      'UPDATE player_cooldowns SET hospital = ? WHERE user_id = ?',
      [Date.now() + 300000, auth.userId]
    );

    return NextResponse.json({
      message: 'Treatment completed!',
      result: {
        treatmentType,
        cost: treatment.cost,
        lifeRestored: treatment.lifeRestored,
        newLife: Math.min(100, playerData.player.life + treatment.lifeRestored)
      }
    });
  } catch (error) {
    console.error('Hospital error:', error);
    return NextResponse.json(
      { error: 'Hospital treatment failed' },
      { status: 500 }
    );
  }
}
