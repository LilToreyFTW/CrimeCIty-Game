import express from 'express';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../database/init.js';
import { detectVPN, registerMeteredConnection, checkMeteredConnection } from '../utils/ipUtils.js';

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

// Register metered connection
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Detect VPN and connection type
    const vpnInfo = await detectVPN(clientIP);
    
    if (!vpnInfo.isMetered) {
      return res.status(400).json({
        error: 'Not a metered connection',
        message: 'This endpoint is only for mobile/hotspot connections',
        vpnInfo: vpnInfo
      });
    }

    // Register the metered connection
    const result = await registerMeteredConnection(
      req.user.userId, 
      clientIP, 
      vpnInfo.provider || 'Unknown'
    );

    if (result.success) {
      res.json({
        message: 'Metered connection registered successfully',
        connectionType: vpnInfo.provider,
        ipAddress: clientIP
      });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Register metered connection error:', error);
    res.status(500).json({ error: 'Failed to register metered connection' });
  }
});

// Check metered connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const meteredCheck = await checkMeteredConnection(req.user.userId, clientIP);
    
    res.json({
      isMetered: meteredCheck.isMetered,
      isAllowed: meteredCheck.isAllowed,
      message: meteredCheck.message,
      registeredIP: meteredCheck.registeredIP,
      currentIP: meteredCheck.currentIP
    });
  } catch (error) {
    console.error('Check metered connection error:', error);
    res.status(500).json({ error: 'Failed to check metered connection' });
  }
});

// Get metered connection history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await dbGet(
      'SELECT * FROM metered_connections WHERE user_id = ? ORDER BY last_used DESC',
      [req.user.userId]
    );
    
    res.json({ history });
  } catch (error) {
    console.error('Get metered connection history error:', error);
    res.status(500).json({ error: 'Failed to get metered connection history' });
  }
});

export default router;
