import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(__dirname, '../../database.sqlite');

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

    // Add date_of_birth column if it doesn't exist (for existing databases)
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

    // VPN detection cache
    await dbRun(`
      CREATE TABLE IF NOT EXISTS vpn_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT UNIQUE NOT NULL,
        is_vpn BOOLEAN NOT NULL,
        is_proxy BOOLEAN NOT NULL,
        is_metered BOOLEAN DEFAULT 0,
        provider TEXT,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `);

    // Metered connection tracking
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

    // Admin/Owner system
    await dbRun(`
      CREATE TABLE IF NOT EXISTS admin_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_string TEXT UNIQUE NOT NULL,
        key_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        used_by INTEGER,
        used_at DATETIME,
        FOREIGN KEY (used_by) REFERENCES users (id)
      )
    `);

    // Admin access codes
    await dbRun(`
      CREATE TABLE IF NOT EXISTS admin_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        used_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Admin roles and permissions
    await dbRun(`
      CREATE TABLE IF NOT EXISTS admin_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT,
        granted_by INTEGER,
        granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (granted_by) REFERENCES users (id)
      )
    `);

    // API Keys table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        key_string TEXT UNIQUE NOT NULL,
        access_level TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        last_used DATETIME,
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
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

    // Owner account
    await dbRun(`
      INSERT OR IGNORE INTO users (id, email, password_hash, username, ip_address, is_active, is_verified) 
      VALUES (1, 'owner@crimecity.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'TSlizzy2300', '127.0.0.1', 1, 1)
    `);

    // Insert owner role
    await dbRun(`
      INSERT OR IGNORE INTO admin_roles (user_id, role, permissions) 
      VALUES (1, 'OWNER', 'ALL')
    `);

    // Generate admin keys
    await generateAdminKeys();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Generate admin keys function
async function generateAdminKeys() {
  try {
    // Check if admin keys already exist
    const existingKeys = await dbAll('SELECT COUNT(*) as count FROM admin_keys');
    if (existingKeys[0].count > 0) {
      console.log('Admin keys already exist');
      return;
    }

    // Generate 3 admin keys
    const adminKeys = [
      {
        key: crypto.randomBytes(32).toString('hex'),
        type: 'ADMIN_KEY_1'
      },
      {
        key: crypto.randomBytes(32).toString('hex'),
        type: 'ADMIN_KEY_2'
      },
      {
        key: crypto.randomBytes(32).toString('hex'),
        type: 'ADMIN_KEY_3'
      }
    ];

    // Insert admin keys
    for (const adminKey of adminKeys) {
      await dbRun(
        'INSERT INTO admin_keys (key_string, key_type) VALUES (?, ?)',
        [adminKey.key, adminKey.type]
      );
    }

    console.log('Admin keys generated successfully');
    console.log('Admin Keys:');
    adminKeys.forEach((key, index) => {
      console.log(`${key.type}: ${key.key}`);
    });
  } catch (error) {
    console.error('Failed to generate admin keys:', error);
  }
}

// Generate 8-digit admin access code
export async function generateAdminCode(userId) {
  try {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await dbRun(
      'INSERT INTO admin_codes (code, user_id, expires_at) VALUES (?, ?, ?)',
      [code, userId, expiresAt.toISOString()]
    );

    return code;
  } catch (error) {
    console.error('Failed to generate admin code:', error);
    throw error;
  }
}

// Verify admin key
export async function verifyAdminKey(keyString) {
  try {
    const key = await dbGet(
      'SELECT * FROM admin_keys WHERE key_string = ? AND is_active = 1',
      [keyString]
    );
    return key;
  } catch (error) {
    console.error('Failed to verify admin key:', error);
    return null;
  }
}

// Verify admin code
export async function verifyAdminCode(code) {
  try {
    const adminCode = await dbGet(
      'SELECT * FROM admin_codes WHERE code = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP',
      [code]
    );
    return adminCode;
  } catch (error) {
    console.error('Failed to verify admin code:', error);
    return null;
  }
}

// Check user admin role
export async function getUserAdminRole(userId) {
  try {
    const role = await dbGet(
      'SELECT * FROM admin_roles WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    return role;
  } catch (error) {
    console.error('Failed to get user admin role:', error);
    return null;
  }
}
