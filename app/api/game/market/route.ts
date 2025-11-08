import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbGet, dbAll, ensureDatabase } from '@/lib/database';
import { getPlayerData, addItemToInventory, getPlayerInventory } from '@/lib/gameDatabase';

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

// Buy item
export async function POST(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { itemType, itemName, quantity, price } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    const totalCost = price * quantity;
    
    // Check if player has enough money
    if (playerData.player.money < totalCost) {
      return NextResponse.json(
        { error: `Not enough money. Total cost: $${totalCost}` },
        { status: 400 }
      );
    }

    // Add item to inventory
    await addItemToInventory(auth.userId, itemType, itemName, quantity);

    // Record transaction
    await dbGet(
      'INSERT INTO market_transactions (user_id, transaction_type, item_name, item_type, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
      [auth.userId, 'buy', itemName, itemType, quantity, totalCost]
    );

    // Deduct money
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money - totalCost
      }
    };
    await updatePlayerStats(auth.userId, updates);

    return NextResponse.json({
      message: `Successfully purchased ${quantity}x ${itemName}!`,
      result: {
        itemName,
        itemType,
        quantity,
        totalCost
      }
    });
  } catch (error) {
    console.error('Market buy error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase item' },
      { status: 500 }
    );
  }
}

// Sell item
export async function PUT(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { itemId, quantity, price } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    const inventory = await getPlayerInventory(auth.userId);
    const item = inventory.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    if (item.quantity < quantity) {
      return NextResponse.json(
        { error: `Not enough items. You have ${item.quantity}` },
        { status: 400 }
      );
    }

    const totalEarnings = price * quantity;

    // Update inventory
    if (item.quantity === quantity) {
      await dbGet('DELETE FROM player_inventory WHERE id = ?', [itemId]);
    } else {
      await dbGet('UPDATE player_inventory SET quantity = quantity - ? WHERE id = ?', [quantity, itemId]);
    }

    // Record transaction
    await dbGet(
      'INSERT INTO market_transactions (user_id, transaction_type, item_name, item_type, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
      [auth.userId, 'sell', item.item_name, item.item_type, quantity, totalEarnings]
    );

    // Add money
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money + totalEarnings
      }
    };
    await updatePlayerStats(auth.userId, updates);

    return NextResponse.json({
      message: `Successfully sold ${quantity}x ${item.item_name}!`,
      result: {
        itemName: item.item_name,
        quantity,
        totalEarnings
      }
    });
  } catch (error) {
    console.error('Market sell error:', error);
    return NextResponse.json(
      { error: 'Failed to sell item' },
      { status: 500 }
    );
  }
}

// Get inventory
export async function GET(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const inventory = await getPlayerInventory(auth.userId);
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve inventory' },
      { status: 500 }
    );
  }
}
