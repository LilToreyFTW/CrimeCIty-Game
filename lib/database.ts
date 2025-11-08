import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(process.cwd(), 'database.sqlite');

export const db = new sqlite3.Database(dbPath);

// Promisify database methods
export const dbRun = promisify(db.run.bind(db));
export const dbGet = promisify(db.get.bind(db));
export const dbAll = promisify(db.all.bind(db));

export async function initDatabase() {
  try {
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
        verification_expires DATETIME,
        game_data TEXT
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

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Initialize database on import
initDatabase();
