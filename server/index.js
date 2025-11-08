import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import ipRoutes from './routes/ip.js';
import meteredRoutes from './routes/metered.js';
import adminRoutes from './routes/admin.js';
import apiKeysRoutes from './routes/apiKeys.js';
import { initDatabase } from './database/init.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.ipify.org", "https://ipapi.co"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
await initDatabase();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/metered', meteredRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/keys', apiKeysRoutes);

// Serve static files
app.use(express.static(join(__dirname, '../')));
app.use('/src', express.static(join(__dirname, '../src')));
app.use('/html', express.static(join(__dirname, '../html')));

// Serve main HTML file
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../index.html'));
});

// Serve auth page
app.get('/src/auth.html', (req, res) => {
  res.sendFile(join(__dirname, '../src/auth.html'));
});

// Serve verification page
app.get('/verify-email.html', (req, res) => {
  res.sendFile(join(__dirname, '../verify-email.html'));
});

// Handle all other routes (SPA routing)
app.get('*', (req, res) => {
  // If it's an API route, let it fall through to 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other routes, serve the main HTML file (SPA)
  res.sendFile(join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
