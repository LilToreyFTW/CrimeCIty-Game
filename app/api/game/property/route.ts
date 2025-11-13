import { NextResponse, NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  userId: string;
  [key: string]: any;
};
import { dbGet, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, addProperty, getPlayerProperties } from '@/lib/gameDatabase';

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
    
    const { propertyName, propertyType, price } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    // Check if player has enough money
    if (playerData.player.money < price) {
      return NextResponse.json(
        { error: `Not enough money. Property costs $${price}` },
        { status: 400 }
      );
    }

    // Calculate rental income and fees (10% of price as rental, 1% as fees)
    const rentalIncome = Math.floor(price * 0.1);
    const fees = Math.floor(price * 0.01);

    // Add property
    await addProperty(
      auth.userId,
      propertyName,
      propertyType,
      price,
      price,
      rentalIncome,
      fees
    );

    // Deduct money
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money - price,
        networth: playerData.player.networth + price
      }
    };
    await updatePlayerStats(auth.userId, updates);

    return NextResponse.json({
      message: `Successfully purchased ${propertyName}!`,
      property: {
        name: propertyName,
        type: propertyType,
        price,
        rentalIncome,
        fees
      }
    });
  } catch (error) {
    console.error('Buy property error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase property' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const properties = await getPlayerProperties(auth.userId);
    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Get properties error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve properties' },
      { status: 500 }
    );
  }
}


