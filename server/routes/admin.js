import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbGet, dbRun, dbAll } from '../database/init.js';
import { verifyAdminKey, verifyAdminCode, generateAdminCode, getUserAdminRole } from '../database/init.js';

const router = express.Router();

// Middleware to verify admin access
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has admin role
    const adminRole = await getUserAdminRole(decoded.userId);
    if (!adminRole) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.adminRole = adminRole;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Owner login endpoint
router.post('/owner-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username !== 'TSlizzy2300') {
      return res.status(401).json({ error: 'Invalid owner credentials' });
    }

    // Get owner user
    const owner = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!owner) {
      return res.status(401).json({ error: 'Owner account not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, owner.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid owner credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: owner.id, email: owner.email, username: owner.username, role: 'OWNER' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Owner login successful',
      token,
      user: {
        id: owner.id,
        email: owner.email,
        username: owner.username,
        role: 'OWNER'
      }
    });
  } catch (error) {
    console.error('Owner login error:', error);
    res.status(500).json({ error: 'Owner login failed' });
  }
});

// Admin key verification
router.post('/verify-admin-key', async (req, res) => {
  try {
    const { adminKey } = req.body;
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

    // Verify admin key
    const adminKeyData = await verifyAdminKey(adminKey);
    if (!adminKeyData) {
      return res.status(400).json({ error: 'Invalid admin key' });
    }

    if (adminKeyData.used_by) {
      return res.status(400).json({ error: 'Admin key already used' });
    }

    // Grant admin role
    await dbRun(
      'INSERT INTO admin_roles (user_id, role, permissions, granted_by) VALUES (?, ?, ?, ?)',
      [user.id, 'ADMIN', 'MODERATE_USERS,MODERATE_GAME,VIEW_ANALYTICS', 1]
    );

    // Mark key as used
    await dbRun(
      'UPDATE admin_keys SET used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id, adminKeyData.id]
    );

    res.json({
      message: 'Admin access granted successfully',
      role: 'ADMIN',
      permissions: 'MODERATE_USERS,MODERATE_GAME,VIEW_ANALYTICS'
    });
  } catch (error) {
    console.error('Admin key verification error:', error);
    res.status(500).json({ error: 'Admin key verification failed' });
  }
});

// Generate admin access code
router.post('/generate-admin-code', authenticateAdmin, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }

    // Check if target user exists
    const targetUser = await dbGet('SELECT id, username FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Generate admin code
    const adminCode = await generateAdminCode(targetUserId);

    res.json({
      message: 'Admin access code generated successfully',
      code: adminCode,
      targetUser: targetUser.username,
      expiresIn: '24 hours'
    });
  } catch (error) {
    console.error('Generate admin code error:', error);
    res.status(500).json({ error: 'Failed to generate admin code' });
  }
});

// Use admin access code
router.post('/use-admin-code', async (req, res) => {
  try {
    const { code } = req.body;
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

    // Verify admin code
    const adminCodeData = await verifyAdminCode(code);
    if (!adminCodeData) {
      return res.status(400).json({ error: 'Invalid or expired admin code' });
    }

    if (adminCodeData.user_id !== user.id) {
      return res.status(400).json({ error: 'Admin code not assigned to this user' });
    }

    // Grant admin role
    await dbRun(
      'INSERT INTO admin_roles (user_id, role, permissions, granted_by) VALUES (?, ?, ?, ?)',
      [user.id, 'ADMIN', 'MODERATE_USERS,MODERATE_GAME,VIEW_ANALYTICS', adminCodeData.user_id]
    );

    // Mark code as used
    await dbRun(
      'UPDATE admin_codes SET used_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?',
      [adminCodeData.id]
    );

    res.json({
      message: 'Admin access granted successfully',
      role: 'ADMIN',
      permissions: 'MODERATE_USERS,MODERATE_GAME,VIEW_ANALYTICS'
    });
  } catch (error) {
    console.error('Use admin code error:', error);
    res.status(500).json({ error: 'Failed to use admin code' });
  }
});

// Get admin dashboard data
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
    const activeUsers = await dbGet('SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-24 hours")');
    const newUsers = await dbGet('SELECT COUNT(*) as count FROM users WHERE created_at > datetime("now", "-24 hours")');

    // Get game statistics
    const totalGameData = await dbGet('SELECT COUNT(*) as count FROM users WHERE game_data IS NOT NULL');
    const totalMoney = await dbGet('SELECT SUM(CAST(JSON_EXTRACT(game_data, "$.player.money") AS INTEGER)) as total FROM users WHERE game_data IS NOT NULL');

    // Get recent activity
    const recentLogins = await dbAll(
      'SELECT username, last_login FROM users WHERE last_login > datetime("now", "-24 hours") ORDER BY last_login DESC LIMIT 10'
    );

    // Get admin keys status
    const adminKeys = await dbAll('SELECT key_type, is_active, used_by, used_at FROM admin_keys');

    res.json({
      stats: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        newUsers: newUsers.count,
        totalGameData: totalGameData.count,
        totalMoney: totalMoney.total || 0
      },
      recentActivity: recentLogins,
      adminKeys: adminKeys,
      userRole: req.adminRole.role,
      permissions: req.adminRole.permissions
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await dbAll(
      'SELECT id, username, email, created_at, last_login, is_active FROM users ORDER BY created_at DESC'
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await dbGet(
      'SELECT id, username, email, created_at, last_login, is_active, game_data FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's admin role if any
    const adminRole = await getUserAdminRole(userId);

    res.json({
      user: {
        ...user,
        adminRole: adminRole
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user status
router.put('/users/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    await dbRun(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get admin keys
router.get('/admin-keys', authenticateAdmin, async (req, res) => {
  try {
    const keys = await dbAll(
      'SELECT id, key_string, key_type, is_active, used_by, used_at, created_at FROM admin_keys ORDER BY created_at DESC'
    );

    res.json({ keys });
  } catch (error) {
    console.error('Get admin keys error:', error);
    res.status(500).json({ error: 'Failed to get admin keys' });
  }
});

// Get admin codes
router.get('/admin-codes', authenticateAdmin, async (req, res) => {
  try {
    const codes = await dbAll(
      'SELECT code, user_id, created_at, expires_at, is_active, used_at FROM admin_codes ORDER BY created_at DESC'
    );

    res.json({ codes });
  } catch (error) {
    console.error('Get admin codes error:', error);
    res.status(500).json({ error: 'Failed to get admin codes' });
  }
});

export default router;
