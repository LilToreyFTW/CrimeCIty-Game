import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - use /tmp for Vercel serverless, local path for development
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(process.cwd(), 'database.sqlite');

export const db = new sqlite3.Database(dbPath);

// Promisify database methods
export const dbRun = promisify(db.run.bind(db));
export const dbGet = promisify(db.get.bind(db));
export const dbAll = promisify(db.all.bind(db));

// Lazy initialization flag
let dbInitialized = false;

export async function initDatabase() {
  if (dbInitialized) return;
  
  try {
    // ============================================
    // USER & AUTHENTICATION TABLES
    // ============================================
    
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        date_of_birth TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        is_verified BOOLEAN DEFAULT 0,
        verification_token TEXT,
        verification_expires DATETIME
      )
    `);

    // Add date_of_birth column if it doesn't exist
    try {
      await dbRun(`ALTER TABLE users ADD COLUMN date_of_birth TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // IP tracking table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS ip_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        user_id INTEGER,
        is_vpn BOOLEAN DEFAULT 0,
        is_proxy BOOLEAN DEFAULT 0,
        country TEXT,
        region TEXT,
        city TEXT,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Login attempts table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        email TEXT,
        success BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        is_vpn BOOLEAN DEFAULT 0
      )
    `);

    // Email verification table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        verification_token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        verified_at DATETIME,
        is_used BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Metered connections table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS metered_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        is_metered BOOLEAN DEFAULT 1,
        connection_type TEXT,
        first_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // VPN cache table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS vpn_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT UNIQUE NOT NULL,
        is_vpn BOOLEAN DEFAULT 0,
        is_proxy BOOLEAN DEFAULT 0,
        provider TEXT,
        is_metered BOOLEAN DEFAULT 0,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      )
    `);

    // ============================================
    // PLAYER DATA TABLES
    // ============================================

    // Player stats table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT DEFAULT 'Player [0000001]',
        money INTEGER DEFAULT 10000,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank TEXT DEFAULT '#7 Average Outcast',
        life INTEGER DEFAULT 100,
        energy INTEGER DEFAULT 100,
        age INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Single',
        networth INTEGER DEFAULT 10000,
        respect INTEGER DEFAULT 0,
        location TEXT DEFAULT 'City Center',
        travel_time INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player combat stats
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_combat_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        strength INTEGER DEFAULT 100,
        defense INTEGER DEFAULT 100,
        speed INTEGER DEFAULT 100,
        dexterity INTEGER DEFAULT 100,
        endurance INTEGER DEFAULT 100,
        intelligence INTEGER DEFAULT 100,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player working stats
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_working_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        manual_labor INTEGER DEFAULT 100,
        intelligence INTEGER DEFAULT 100,
        endurance INTEGER DEFAULT 100,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player battle statistics
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_battle_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        damage_dealt INTEGER DEFAULT 0,
        damage_taken INTEGER DEFAULT 0,
        critical_hits INTEGER DEFAULT 0,
        dodges INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player crime statistics
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_crime_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        successful INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        arrested INTEGER DEFAULT 0,
        escaped INTEGER DEFAULT 0,
        total_earnings INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player job statistics
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_job_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        total_earnings INTEGER DEFAULT 0,
        hours_worked INTEGER DEFAULT 0,
        promotions INTEGER DEFAULT 0,
        fired INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player faction statistics
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_faction_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        wars_won INTEGER DEFAULT 0,
        wars_lost INTEGER DEFAULT 0,
        territory_controlled INTEGER DEFAULT 0,
        members_recruited INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player cooldowns
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_cooldowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        battle INTEGER DEFAULT 0,
        crime INTEGER DEFAULT 0,
        job INTEGER DEFAULT 0,
        hospital INTEGER DEFAULT 0,
        jail INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Player status effects
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_status_effects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        effect_type TEXT NOT NULL,
        effect_value INTEGER,
        duration INTEGER,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // INVENTORY SYSTEM
    // ============================================

    // Player inventory
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        equipped BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // PROPERTY SYSTEM
    // ============================================

    // Player properties
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        property_name TEXT NOT NULL,
        property_type TEXT NOT NULL,
        purchase_price INTEGER NOT NULL,
        current_value INTEGER NOT NULL,
        rental_income INTEGER DEFAULT 0,
        fees INTEGER DEFAULT 0,
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // JOB SYSTEM
    // ============================================

    // Player jobs
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_name TEXT NOT NULL,
        job_type TEXT NOT NULL,
        salary INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Job history
    await dbRun(`
      CREATE TABLE IF NOT EXISTS job_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_name TEXT NOT NULL,
        job_type TEXT NOT NULL,
        salary INTEGER NOT NULL,
        started_at DATETIME NOT NULL,
        ended_at DATETIME,
        reason TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // EDUCATION SYSTEM
    // ============================================

    // Education courses
    await dbRun(`
      CREATE TABLE IF NOT EXISTS education_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT UNIQUE NOT NULL,
        course_type TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        stat_bonus TEXT,
        cost INTEGER DEFAULT 0
      )
    `);

    // Player education progress
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        course_name TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (course_id) REFERENCES education_courses (id)
      )
    `);

    // ============================================
    // BATTLE SYSTEM
    // ============================================

    // Battle history
    await dbRun(`
      CREATE TABLE IF NOT EXISTS battle_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        opponent_name TEXT NOT NULL,
        battle_type TEXT NOT NULL,
        won BOOLEAN NOT NULL,
        damage_dealt INTEGER DEFAULT 0,
        damage_taken INTEGER DEFAULT 0,
        experience_gained INTEGER DEFAULT 0,
        money_gained INTEGER DEFAULT 0,
        battle_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // CRIME SYSTEM
    // ============================================

    // Crime history
    await dbRun(`
      CREATE TABLE IF NOT EXISTS crime_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        crime_type TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        arrested BOOLEAN DEFAULT 0,
        escaped BOOLEAN DEFAULT 0,
        money_gained INTEGER DEFAULT 0,
        energy_cost INTEGER DEFAULT 0,
        risk_level TEXT,
        crime_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // MISSION SYSTEM
    // ============================================

    // Missions
    await dbRun(`
      CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_name TEXT NOT NULL,
        mission_type TEXT NOT NULL,
        description TEXT,
        reward_money INTEGER DEFAULT 0,
        reward_experience INTEGER DEFAULT 0,
        difficulty TEXT,
        requirements TEXT
      )
    `);

    // Player mission progress
    await dbRun(`
      CREATE TABLE IF NOT EXISTS player_missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mission_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (mission_id) REFERENCES missions (id)
      )
    `);

    // ============================================
    // CASINO SYSTEM
    // ============================================

    // Casino game history
    await dbRun(`
      CREATE TABLE IF NOT EXISTS casino_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        bet_amount INTEGER NOT NULL,
        won BOOLEAN NOT NULL,
        payout INTEGER DEFAULT 0,
        game_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // FACTION SYSTEM
    // ============================================

    // Factions
    await dbRun(`
      CREATE TABLE IF NOT EXISTS factions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faction_name TEXT UNIQUE NOT NULL,
        creator_id INTEGER NOT NULL,
        funds INTEGER DEFAULT 0,
        members_count INTEGER DEFAULT 1,
        territory_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      )
    `);

    // Faction members
    await dbRun(`
      CREATE TABLE IF NOT EXISTS faction_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faction_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (faction_id) REFERENCES factions (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(faction_id, user_id)
      )
    `);

    // Faction wars
    await dbRun(`
      CREATE TABLE IF NOT EXISTS faction_wars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faction_id INTEGER NOT NULL,
        opponent_faction_id INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        winner_id INTEGER,
        FOREIGN KEY (faction_id) REFERENCES factions (id),
        FOREIGN KEY (opponent_faction_id) REFERENCES factions (id),
        FOREIGN KEY (winner_id) REFERENCES factions (id)
      )
    `);

    // Faction raids
    await dbRun(`
      CREATE TABLE IF NOT EXISTS faction_raids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faction_id INTEGER NOT NULL,
        target_location TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        loot_gained INTEGER DEFAULT 0,
        raid_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (faction_id) REFERENCES factions (id)
      )
    `);

    // ============================================
    // HOSPITAL SYSTEM
    // ============================================

    // Hospital visits
    await dbRun(`
      CREATE TABLE IF NOT EXISTS hospital_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        treatment_type TEXT NOT NULL,
        cost INTEGER NOT NULL,
        life_restored INTEGER DEFAULT 0,
        visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // JAIL SYSTEM
    // ============================================

    // Jail sentences
    await dbRun(`
      CREATE TABLE IF NOT EXISTS jail_sentences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        sentence_length INTEGER NOT NULL,
        reason TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        released_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // MARKET SYSTEM
    // ============================================

    // Market transactions
    await dbRun(`
      CREATE TABLE IF NOT EXISTS market_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // RACEWAY SYSTEM
    // ============================================

    // Raceway races
    await dbRun(`
      CREATE TABLE IF NOT EXISTS raceway_races (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        race_type TEXT NOT NULL,
        position INTEGER,
        prize_money INTEGER DEFAULT 0,
        race_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // NEWSPAPER SYSTEM
    // ============================================

    // Newspaper articles
    await dbRun(`
      CREATE TABLE IF NOT EXISTS newspaper_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        article_title TEXT NOT NULL,
        article_content TEXT NOT NULL,
        article_type TEXT,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // CHARACTER CUSTOMIZATION
    // ============================================

    // Character appearance
    await dbRun(`
      CREATE TABLE IF NOT EXISTS character_appearance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        appearance_data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ============================================
    // INSERT DEFAULT EDUCATION COURSES
    // ============================================

    const courses = [
      { name: 'Biology', type: 'BIOLOGY', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Business', type: 'BUSINESS', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Combat Training', type: 'COMBAT TRAINING', duration: 60, stat_bonus: 'strength', cost: 1000 },
      { name: 'Computer Science', type: 'COMPUTER SCIENCE', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'General Studies', type: 'GENERAL STUDIES', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Health & Fitness', type: 'HEALTH & FITNESS', duration: 60, stat_bonus: 'endurance', cost: 1000 },
      { name: 'History', type: 'HISTORY', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Law', type: 'LAW', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Mathematics', type: 'MATHEMATICS', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Psychology', type: 'PSYCHOLOGY', duration: 60, stat_bonus: 'intelligence', cost: 1000 },
      { name: 'Self Defense', type: 'SELF DEFENSE', duration: 60, stat_bonus: 'defense', cost: 1000 },
      { name: 'Sports Science', type: 'SPORTS SCIENCE', duration: 60, stat_bonus: 'speed', cost: 1000 }
    ];

    for (const course of courses) {
      try {
        await dbRun(
          `INSERT OR IGNORE INTO education_courses (course_name, course_type, duration, stat_bonus, cost) 
           VALUES (?, ?, ?, ?, ?)`,
          [course.name, course.type, course.duration, course.stat_bonus, course.cost]
        );
      } catch (error) {
        // Course already exists, ignore
      }
    }

    dbInitialized = true;
    console.log('✅ Full game database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Lazy initialization - only initialize when needed
export async function ensureDatabase() {
  if (!dbInitialized) {
    await initDatabase();
  }
}