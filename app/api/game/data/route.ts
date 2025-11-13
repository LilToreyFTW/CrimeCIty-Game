import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  [key: string]: any;
}
import { dbGet, dbRun, ensureDatabase } from '@/lib/database';
import { getPlayerData, initializePlayerData, updatePlayerStats } from '@/lib/gameDatabase';

// Middleware to verify JWT token
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

export async function GET(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    // Get all player data from normalized tables
    const playerData = await getPlayerData(auth.userId);
    
    // Also get inventory, properties, etc.
    const { getPlayerInventory, getPlayerProperties, getCurrentJob, getPlayerEducation, getPlayerFaction } = await import('@/lib/gameDatabase');
    const inventory = await getPlayerInventory(auth.userId);
    const properties = await getPlayerProperties(auth.userId);
    const currentJob = await getCurrentJob(auth.userId);
    const education = await getPlayerEducation(auth.userId);
    const faction = await getPlayerFaction(auth.userId);
    
    // Format as game data object
    const gameData = {
      player: {
        ...playerData.player,
        stats: playerData.combatStats,
        workingStats: playerData.workingStats,
        battleStats: playerData.battleStats,
        crimeStats: playerData.crimeStats,
        jobStats: playerData.jobStats,
        factionStats: playerData.factionStats,
        cooldowns: playerData.cooldowns,
        statusEffects: playerData.statusEffects,
        property: properties.length > 0 ? properties[0] : { name: 'None', cost: 0, fees: 0 },
        faction: faction || { name: 'None', days: 0 }
      },
      inventory,
      properties,
      currentJob,
      education
    };
    
    return NextResponse.json({ gameData });
  } catch (error) {
    console.error('Get game data error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve game data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { gameData } = await request.json();
    
    if (!gameData) {
      return NextResponse.json(
        { error: 'Game data is required' },
        { status: 400 }
      );
    }

    // Ensure player data is initialized
    await initializePlayerData(auth.userId);
    
    // Update player stats from gameData
    await updatePlayerStats(auth.userId, {
      player: gameData.player,
      combatStats: gameData.player?.stats,
      workingStats: gameData.player?.workingStats
    });

    return NextResponse.json({ 
      message: 'Game data saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save game data error:', error);
    return NextResponse.json(
      { error: 'Failed to save game data' },
      { status: 500 }
    );
  }
}
