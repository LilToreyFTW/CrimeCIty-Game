import { dbRun, dbGet, dbAll, ensureDatabase } from '@/lib/database';

// ============================================
// PLAYER DATA HELPERS
// ============================================

export async function getPlayerData(userId: number) {
  await ensureDatabase();
  
  const player = await dbGet('SELECT * FROM player_stats WHERE user_id = ?', [userId]);
  const combatStats = await dbGet('SELECT * FROM player_combat_stats WHERE user_id = ?', [userId]);
  const workingStats = await dbGet('SELECT * FROM player_working_stats WHERE user_id = ?', [userId]);
  const battleStats = await dbGet('SELECT * FROM player_battle_stats WHERE user_id = ?', [userId]);
  const crimeStats = await dbGet('SELECT * FROM player_crime_stats WHERE user_id = ?', [userId]);
  const jobStats = await dbGet('SELECT * FROM player_job_stats WHERE user_id = ?', [userId]);
  const factionStats = await dbGet('SELECT * FROM player_faction_stats WHERE user_id = ?', [userId]);
  const cooldowns = await dbGet('SELECT * FROM player_cooldowns WHERE user_id = ?', [userId]);
  const statusEffects = await dbAll('SELECT * FROM player_status_effects WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP', [userId]);
  
  // Initialize if doesn't exist
  if (!player) {
    await initializePlayerData(userId);
    return getPlayerData(userId);
  }
  
  return {
    player,
    combatStats: combatStats || { strength: 100, defense: 100, speed: 100, dexterity: 100, endurance: 100, intelligence: 100 },
    workingStats: workingStats || { manual_labor: 100, intelligence: 100, endurance: 100 },
    battleStats: battleStats || { wins: 0, losses: 0, damage_dealt: 0, damage_taken: 0, critical_hits: 0, dodges: 0 },
    crimeStats: crimeStats || { successful: 0, failed: 0, arrested: 0, escaped: 0, total_earnings: 0 },
    jobStats: jobStats || { total_earnings: 0, hours_worked: 0, promotions: 0, fired: 0 },
    factionStats: factionStats || { wars_won: 0, wars_lost: 0, territory_controlled: 0, members_recruited: 0 },
    cooldowns: cooldowns || { battle: 0, crime: 0, job: 0, hospital: 0, jail: 0 },
    statusEffects: statusEffects || []
  };
}

export async function initializePlayerData(userId: number) {
  await ensureDatabase();
  
  await dbRun(
    `INSERT OR IGNORE INTO player_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_combat_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_working_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_battle_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_crime_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_job_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_faction_stats (user_id) VALUES (?)`,
    [userId]
  );
  await dbRun(
    `INSERT OR IGNORE INTO player_cooldowns (user_id) VALUES (?)`,
    [userId]
  );
}

export async function updatePlayerStats(userId: number, updates: any) {
  await ensureDatabase();
  
  if (updates.player) {
    await dbRun(
      `UPDATE player_stats SET 
        name = COALESCE(?, name),
        money = COALESCE(?, money),
        points = COALESCE(?, points),
        level = COALESCE(?, level),
        rank = COALESCE(?, rank),
        life = COALESCE(?, life),
        energy = COALESCE(?, energy),
        age = COALESCE(?, age),
        status = COALESCE(?, status),
        networth = COALESCE(?, networth),
        respect = COALESCE(?, respect),
        location = COALESCE(?, location),
        travel_time = COALESCE(?, travel_time),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        updates.player.name, updates.player.money, updates.player.points,
        updates.player.level, updates.player.rank, updates.player.life,
        updates.player.energy, updates.player.age, updates.player.status,
        updates.player.networth, updates.player.respect, updates.player.location,
        updates.player.travel_time, userId
      ]
    );
  }
  
  if (updates.combatStats) {
    await dbRun(
      `UPDATE player_combat_stats SET 
        strength = COALESCE(?, strength),
        defense = COALESCE(?, defense),
        speed = COALESCE(?, speed),
        dexterity = COALESCE(?, dexterity),
        endurance = COALESCE(?, endurance),
        intelligence = COALESCE(?, intelligence),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        updates.combatStats.strength, updates.combatStats.defense,
        updates.combatStats.speed, updates.combatStats.dexterity,
        updates.combatStats.endurance, updates.combatStats.intelligence,
        userId
      ]
    );
  }
}

// ============================================
// INVENTORY HELPERS
// ============================================

export async function getPlayerInventory(userId: number) {
  await ensureDatabase();
  return await dbAll('SELECT * FROM player_inventory WHERE user_id = ?', [userId]);
}

export async function addItemToInventory(userId: number, itemType: string, itemName: string, quantity: number = 1) {
  await ensureDatabase();
  
  const existing = await dbGet(
    'SELECT * FROM player_inventory WHERE user_id = ? AND item_type = ? AND item_name = ?',
    [userId, itemType, itemName]
  );
  
  if (existing) {
    await dbRun(
      'UPDATE player_inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, existing.id]
    );
  } else {
    await dbRun(
      'INSERT INTO player_inventory (user_id, item_type, item_name, quantity) VALUES (?, ?, ?, ?)',
      [userId, itemType, itemName, quantity]
    );
  }
}

// ============================================
// PROPERTY HELPERS
// ============================================

export async function getPlayerProperties(userId: number) {
  await ensureDatabase();
  return await dbAll('SELECT * FROM player_properties WHERE user_id = ?', [userId]);
}

export async function addProperty(userId: number, propertyName: string, propertyType: string, purchasePrice: number, currentValue: number, rentalIncome: number = 0, fees: number = 0) {
  await ensureDatabase();
  
  await dbRun(
    `INSERT INTO player_properties (user_id, property_name, property_type, purchase_price, current_value, rental_income, fees)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, propertyName, propertyType, purchasePrice, currentValue, rentalIncome, fees]
  );
}

// ============================================
// BATTLE HELPERS
// ============================================

export async function recordBattle(userId: number, opponentName: string, battleType: string, won: boolean, damageDealt: number, damageTaken: number, experienceGained: number, moneyGained: number) {
  await ensureDatabase();
  
  await dbRun(
    `INSERT INTO battle_history (user_id, opponent_name, battle_type, won, damage_dealt, damage_taken, experience_gained, money_gained)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, opponentName, battleType, won ? 1 : 0, damageDealt, damageTaken, experienceGained, moneyGained]
  );
  
  // Update battle stats
  if (won) {
    await dbRun(
      'UPDATE player_battle_stats SET wins = wins + 1, damage_dealt = damage_dealt + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [damageDealt, userId]
    );
  } else {
    await dbRun(
      'UPDATE player_battle_stats SET losses = losses + 1, damage_taken = damage_taken + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [damageTaken, userId]
    );
  }
}

// ============================================
// CRIME HELPERS
// ============================================

export async function recordCrime(userId: number, crimeType: string, success: boolean, arrested: boolean, escaped: boolean, moneyGained: number, energyCost: number, riskLevel: string) {
  await ensureDatabase();
  
  await dbRun(
    `INSERT INTO crime_history (user_id, crime_type, success, arrested, escaped, money_gained, energy_cost, risk_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, crimeType, success ? 1 : 0, arrested ? 1 : 0, escaped ? 1 : 0, moneyGained, energyCost, riskLevel]
  );
  
  // Update crime stats
  if (success) {
    await dbRun(
      'UPDATE player_crime_stats SET successful = successful + 1, total_earnings = total_earnings + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [moneyGained, userId]
    );
  } else {
    await dbRun(
      'UPDATE player_crime_stats SET failed = failed + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
  }
  
  if (arrested) {
    await dbRun(
      'UPDATE player_crime_stats SET arrested = arrested + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
  }
  
  if (escaped) {
    await dbRun(
      'UPDATE player_crime_stats SET escaped = escaped + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
  }
}

// ============================================
// JOB HELPERS
// ============================================

export async function getCurrentJob(userId: number) {
  await ensureDatabase();
  return await dbGet('SELECT * FROM player_jobs WHERE user_id = ? AND is_active = 1', [userId]);
}

export async function startJob(userId: number, jobName: string, jobType: string, salary: number) {
  await ensureDatabase();
  
  // End current job if exists
  await dbRun(
    'UPDATE player_jobs SET is_active = 0, ended_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_active = 1',
    [userId]
  );
  
  // Start new job
  await dbRun(
    'INSERT INTO player_jobs (user_id, job_name, job_type, salary) VALUES (?, ?, ?, ?)',
    [userId, jobName, jobType, salary]
  );
}

// ============================================
// EDUCATION HELPERS
// ============================================

export async function getPlayerEducation(userId: number) {
  await ensureDatabase();
  return await dbAll(
    `SELECT pe.*, ec.course_type, ec.description, ec.duration, ec.stat_bonus, ec.cost
     FROM player_education pe
     LEFT JOIN education_courses ec ON pe.course_id = ec.id
     WHERE pe.user_id = ?`,
    [userId]
  );
}

export async function enrollInCourse(userId: number, courseId: number, courseName: string) {
  await ensureDatabase();
  
  await dbRun(
    'INSERT OR IGNORE INTO player_education (user_id, course_id, course_name) VALUES (?, ?, ?)',
    [userId, courseId, courseName]
  );
}

export async function completeCourse(userId: number, courseId: number) {
  await ensureDatabase();
  
  await dbRun(
    'UPDATE player_education SET completed = 1, completed_at = CURRENT_TIMESTAMP, progress = 100 WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  );
}

// ============================================
// CASINO HELPERS
// ============================================

export async function recordCasinoGame(userId: number, gameType: string, betAmount: number, won: boolean, payout: number) {
  await ensureDatabase();
  
  await dbRun(
    'INSERT INTO casino_history (user_id, game_type, bet_amount, won, payout) VALUES (?, ?, ?, ?, ?)',
    [userId, gameType, betAmount, won ? 1 : 0, payout]
  );
}

// ============================================
// FACTION HELPERS
// ============================================

export async function createFaction(userId: number, factionName: string) {
  await ensureDatabase();
  
  const result = await dbRun(
    'INSERT INTO factions (faction_name, creator_id) VALUES (?, ?)',
    [factionName, userId]
  );
  
  await dbRun(
    'INSERT INTO faction_members (faction_id, user_id, role) VALUES (?, ?, ?)',
    [result.lastID, userId, 'leader']
  );
  
  return result.lastID;
}

export async function getFaction(factionId: number) {
  await ensureDatabase();
  return await dbGet('SELECT * FROM factions WHERE id = ?', [factionId]);
}

export async function getPlayerFaction(userId: number) {
  await ensureDatabase();
  return await dbGet(
    `SELECT f.* FROM factions f
     JOIN faction_members fm ON f.id = fm.faction_id
     WHERE fm.user_id = ?`,
    [userId]
  );
}
