import express from 'express';
import jwt from 'jsonwebtoken';
import { dbGet, dbAll } from '../database/init.js';
import { getUserIPHistory, checkSuspiciousActivity } from '../utils/ipUtils.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user's IP history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await getUserIPHistory(req.user.userId);
    res.json({ history });
  } catch (error) {
    console.error('Get IP history error:', error);
    res.status(500).json({ error: 'Failed to retrieve IP history' });
  }
});

// Check for suspicious activity
router.get('/suspicious', authenticateToken, async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const suspicious = await checkSuspiciousActivity(clientIP, req.user.userId);
    res.json({ suspicious });
  } catch (error) {
    console.error('Check suspicious activity error:', error);
    res.status(500).json({ error: 'Failed to check suspicious activity' });
  }
});

// Get current IP info
router.get('/current', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    res.json({
      ip: clientIP,
      userAgent: userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get current IP error:', error);
    res.status(500).json({ error: 'Failed to get current IP' });
  }
});

export default router;
