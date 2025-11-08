import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, dbAll, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, createFaction, getPlayerFaction, getFaction } from '@/lib/gameDatabase';

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

// Create faction
export async function POST(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { factionName } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    // Check if already in a faction
    const existingFaction = await getPlayerFaction(auth.userId);
    if (existingFaction) {
      return NextResponse.json(
        { error: 'You are already in a faction' },
        { status: 400 }
      );
    }

    // Check if faction name exists
    const existing = await dbGet('SELECT * FROM factions WHERE faction_name = ?', [factionName]);
    if (existing) {
      return NextResponse.json(
        { error: 'Faction name already taken' },
        { status: 400 }
      );
    }

    // Check if player has enough money ($30M requirement)
    const requiredFunds = 30000000;
    if (playerData.player.money < requiredFunds) {
      return NextResponse.json(
        { error: `Not enough money. Need $${requiredFunds.toLocaleString()} to create a faction.` },
        { status: 400 }
      );
    }

    // Create faction
    const factionId = await createFaction(auth.userId, factionName);

    // Deduct money
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money - requiredFunds
      }
    };
    await updatePlayerStats(auth.userId, updates);

    // Update faction funds
    await dbRun('UPDATE factions SET funds = ? WHERE id = ?', [requiredFunds, factionId]);

    return NextResponse.json({
      message: `Faction "${factionName}" created successfully!`,
      faction: {
        id: factionId,
        name: factionName,
        funds: requiredFunds
      }
    });
  } catch (error) {
    console.error('Create faction error:', error);
    return NextResponse.json(
      { error: 'Failed to create faction' },
      { status: 500 }
    );
  }
}

// Join faction
export async function PUT(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { factionId } = await request.json();
    
    // Check if already in a faction
    const existingFaction = await getPlayerFaction(auth.userId);
    if (existingFaction) {
      return NextResponse.json(
        { error: 'You are already in a faction' },
        { status: 400 }
      );
    }

    const faction = await getFaction(factionId);
    if (!faction) {
      return NextResponse.json(
        { error: 'Faction not found' },
        { status: 404 }
      );
    }

    // Add member
    await dbRun(
      'INSERT INTO faction_members (faction_id, user_id, role) VALUES (?, ?, ?)',
      [factionId, auth.userId, 'member']
    );

    // Update member count
    await dbRun('UPDATE factions SET members_count = members_count + 1 WHERE id = ?', [factionId]);

    return NextResponse.json({
      message: `Successfully joined ${faction.faction_name}!`,
      faction: {
        id: faction.id,
        name: faction.faction_name
      }
    });
  } catch (error) {
    console.error('Join faction error:', error);
    return NextResponse.json(
      { error: 'Failed to join faction' },
      { status: 500 }
    );
  }
}

// Get faction info
export async function GET(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const faction = await getPlayerFaction(auth.userId);
    if (!faction) {
      return NextResponse.json({ faction: null });
    }

    const members = await dbAll(
      'SELECT u.id, u.username, fm.role, fm.joined_at FROM faction_members fm JOIN users u ON fm.user_id = u.id WHERE fm.faction_id = ?',
      [faction.id]
    );

    return NextResponse.json({
      faction: {
        ...faction,
        members
      }
    });
  } catch (error) {
    console.error('Get faction error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve faction' },
      { status: 500 }
    );
  }
}
