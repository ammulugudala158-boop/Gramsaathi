import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import { register, login, unlockPeti, getProfile, updateLanguage } from './controllers/auth.controller.js';
import { getAllSchemes, getSchemeById, matchSchemes, documentCheck } from './controllers/schemes.controller.js';
import { getPetiHistory, saveToPeti, removeFromPeti } from './controllers/peti.controller.js';
import { authenticateJWT } from './middlewares/jwtAuth.js';
import { authenticateUnlockToken } from './middlewares/unlockAuth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(null, true); // Allow dev access
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-unlock-token']
}));

// Body parser with 15MB limit for document camera uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Logging
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GramSaathi Backend API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// ==========================================
// 1. AUTHENTICATION & PROFILE MANAGEMENT
// ==========================================
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/profile', authenticateJWT, getProfile);
app.put('/api/auth/language', authenticateJWT, updateLanguage);
app.post('/api/auth/unlock-peti', authenticateJWT, unlockPeti);

// ==========================================
// 2. GOVERNMENT SCHEMES & GEMINI AI MATCHING
// ==========================================
app.get('/api/schemes', getAllSchemes);
app.get('/api/schemes/:id', getSchemeById);
app.post('/api/schemes/match', matchSchemes);
app.post('/api/schemes/document-check', documentCheck);

// ==========================================
// 3. SAATHI PETI (HIDDEN VAULT)
// ==========================================
// Reading vault strictly requires BOTH JWT and fresh unlock token
app.get('/api/saathi-peti', authenticateJWT, authenticateUnlockToken, getPetiHistory);
// Saving to vault requires standard JWT
app.post('/api/saathi-peti', authenticateJWT, saveToPeti);
// Removing item from vault requires JWT
app.delete('/api/saathi-peti/:id', authenticateJWT, removeFromPeti);
app.get('/', (req, res) => {
  res.json({
    message: "GramSaathi API is running",
    status: "success"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'API route does not exist' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  // Ensure image payload cleanup
  if (req.body && req.body.image_base64) {
    req.body.image_base64 = null;
  }
  res.status(err.status || 500).json({
    error: 'InternalServerError',
    message: err.message || 'An unexpected error occurred.'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 GramSaathi Server is running on port ${PORT}`);
  console.log(`📡 Ready for voice requests at http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.warn(`⚠️ Port ${PORT} is busy, switching to fallback port ${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      console.log(`🚀 GramSaathi Server is running on port ${fallbackPort}`);
      console.log(`📡 Ready for voice requests at http://localhost:${fallbackPort}/api`);
    });
  } else {
    console.error('Server error:', err);
  }
});
