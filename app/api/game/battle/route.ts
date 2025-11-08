import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, recordBattle } from '@/lib/gameDatabase';

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
    
    const { opponent, battleType } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    // Check cooldown
    if (playerData.cooldowns.battle > Date.now()) {
      return NextResponse.json(
        { error: `Battle cooldown active. Wait ${Math.ceil((playerData.cooldowns.battle - Date.now()) / 1000)} seconds` },
        { status: 400 }
      );
    }

    // Check energy
    if (playerData.player.energy < 20) {
      return NextResponse.json(
        { error: 'Not enough energy. Need at least 20 energy for battle.' },
        { status: 400 }
      );
    }

    // Calculate battle outcome based on stats
    const playerStrength = playerData.combatStats.strength || 100;
    const playerDefense = playerData.combatStats.defense || 100;
    const opponentStrength = Math.floor(Math.random() * 150) + 50;
    const opponentDefense = Math.floor(Math.random() * 150) + 50;

    const playerPower = playerStrength + playerDefense;
    const opponentPower = opponentStrength + opponentDefense;
    const totalPower = playerPower + opponentPower;
    
    const winChance = playerPower / totalPower;
    const won = Math.random() < winChance;

    // Calculate damage and rewards
    const damageDealt = won ? Math.floor(Math.random() * 50) + 10 : 0;
    const damageTaken = won ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 40) + 10;
    const experienceGained = won ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 5) + 1;
    const moneyGained = won ? Math.floor(Math.random() * 100) + 20 : 0;

    // Update player stats
    const updates = {
      player: {
        ...playerData.player,
        energy: Math.max(0, playerData.player.energy - 20),
        life: Math.max(0, playerData.player.life - damageTaken),
        money: playerData.player.money + moneyGained,
        points: playerData.player.points + experienceGained
      }
    };

    await updatePlayerStats(auth.userId, updates);

    // Record battle
    await recordBattle(
      auth.userId,
      opponent || 'Unknown Opponent',
      battleType || 'standard',
      won,
      damageDealt,
      damageTaken,
      experienceGained,
      moneyGained
    );

    // Set cooldown (5 minutes)
    await dbRun(
      'UPDATE player_cooldowns SET battle = ? WHERE user_id = ?',
      [Date.now() + 300000, auth.userId]
    );

    return NextResponse.json({
      message: won ? 'Battle won!' : 'Battle lost!',
      result: {
        won,
        damageDealt,
        damageTaken,
        experience: experienceGained,
        money: moneyGained,
        opponent: opponent || 'Unknown Opponent'
      }
    });
  } catch (error) {
    console.error('Battle error:', error);
    return NextResponse.json(
      { error: 'Battle failed' },
      { status: 500 }
    );
  }
}
