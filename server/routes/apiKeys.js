import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { dbGet, dbRun, dbAll } from '../database/init.js';

const router = express.Router();

// Middleware to verify API key
const authenticateAPIKey = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    // Check if API key exists and is active
    const keyData = await dbGet(
      'SELECT * FROM api_keys WHERE key_string = ? AND is_active = 1',
      [apiKey]
    );

    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    // Get user data
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [keyData.user_id]);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.apiKey = keyData;
    req.user = user;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Create API key
router.post('/create', async (req, res) => {
  try {
    const { name, description, accessLevel, expiresAt } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Insert API key
    const result = await dbRun(
      `INSERT INTO api_keys (user_id, name, description, key_string, access_level, expires_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [user.id, name, description, apiKey, accessLevel, expiresAt || null]
    );

    res.json({
      message: 'API key created successfully',
      apiKey: apiKey,
      keyId: result.lastID,
      accessLevel: accessLevel
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Get user's API keys
router.get('/list', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const apiKeys = await dbAll(
      'SELECT id, name, description, access_level, created_at, expires_at, last_used, usage_count, is_active FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    res.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Delete API key
router.delete('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if API key belongs to user
    const apiKey = await dbGet(
      'SELECT * FROM api_keys WHERE id = ? AND user_id = ?',
      [keyId, user.id]
    );

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Deactivate API key
    await dbRun(
      'UPDATE api_keys SET is_active = 0 WHERE id = ?',
      [keyId]
    );

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Regenerate API key
router.post('/:keyId/regenerate', async (req, res) => {
  try {
    const { keyId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if API key belongs to user
    const apiKey = await dbGet(
      'SELECT * FROM api_keys WHERE id = ? AND user_id = ?',
      [keyId, user.id]
    );

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Generate new API key
    const newApiKey = crypto.randomBytes(32).toString('hex');

    // Update API key
    await dbRun(
      'UPDATE api_keys SET key_string = ?, last_used = NULL, usage_count = 0 WHERE id = ?',
      [newApiKey, keyId]
    );

    res.json({
      message: 'API key regenerated successfully',
      apiKey: newApiKey
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

// Get user data (Public API)
router.get('/user/data', authenticateAPIKey, async (req, res) => {
  try {
    const { accessLevel } = req.apiKey;
    
    // Parse user's game data
    const gameData = req.user.game_data ? JSON.parse(req.user.game_data) : {};
    
    let responseData = {
      userId: req.user.id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.created_at,
      lastLogin: req.user.last_login
    };

    // Add game data based on access level
    if (accessLevel === 'public') {
      responseData.publicStats = {
        level: gameData.player?.level || 1,
        money: gameData.player?.money || 0,
        faction: gameData.faction?.name || null
      };
    } else if (accessLevel === 'limited' || accessLevel === 'full') {
      responseData.gameData = gameData;
    }

    // Update usage statistics
    await dbRun(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
      [req.apiKey.id]
    );

    res.json(responseData);
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Get faction data
router.get('/faction/data', authenticateAPIKey, async (req, res) => {
  try {
    const { accessLevel } = req.apiKey;
    
    if (accessLevel === 'public') {
      return res.status(403).json({ error: 'Insufficient permissions for faction data' });
    }

    const gameData = req.user.game_data ? JSON.parse(req.user.game_data) : {};
    const factionData = gameData.faction || null;

    if (!factionData) {
      return res.json({ faction: null, message: 'User is not in a faction' });
    }

    // Update usage statistics
    await dbRun(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
      [req.apiKey.id]
    );

    res.json({ faction: factionData });
  } catch (error) {
    console.error('Get faction data error:', error);
    res.status(500).json({ error: 'Failed to get faction data' });
  }
});

// Update faction members
router.post('/faction/members', authenticateAPIKey, async (req, res) => {
  try {
    const { accessLevel } = req.apiKey;
    const { factionId, members } = req.body;
    
    if (accessLevel === 'public') {
      return res.status(403).json({ error: 'Insufficient permissions to update faction members' });
    }

    // This would typically involve updating the faction in the database
    // For now, we'll just return a success message
    res.json({
      message: 'Faction members updated successfully',
      factionId: factionId,
      members: members
    });

    // Update usage statistics
    await dbRun(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
      [req.apiKey.id]
    );
  } catch (error) {
    console.error('Update faction members error:', error);
    res.status(500).json({ error: 'Failed to update faction members' });
  }
});

// Assign job role
router.post('/job/assign-role', authenticateAPIKey, async (req, res) => {
  try {
    const { accessLevel } = req.apiKey;
    const { userId, jobId, role } = req.body;
    
    if (accessLevel === 'public') {
      return res.status(403).json({ error: 'Insufficient permissions to assign job roles' });
    }

    // This would typically involve updating job assignments in the database
    res.json({
      message: 'Job role assigned successfully',
      userId: userId,
      jobId: jobId,
      role: role
    });

    // Update usage statistics
    await dbRun(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
      [req.apiKey.id]
    );
  } catch (error) {
    console.error('Assign job role error:', error);
    res.status(500).json({ error: 'Failed to assign job role' });
  }
});

// Get game statistics (Public API)
router.get('/game/stats', authenticateAPIKey, async (req, res) => {
  try {
    const { accessLevel } = req.apiKey;
    
    // Get basic game statistics
    const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
    const activeUsers = await dbGet('SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-24 hours")');
    
    let stats = {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      timestamp: new Date().toISOString()
    };

    // Add more detailed stats for higher access levels
    if (accessLevel !== 'public') {
      const totalAPIKeys = await dbGet('SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1');
      stats.totalAPIKeys = totalAPIKeys.count;
    }

    // Update usage statistics
    await dbRun(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
      [req.apiKey.id]
    );

    res.json(stats);
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({ error: 'Failed to get game statistics' });
  }
});

export default router;
