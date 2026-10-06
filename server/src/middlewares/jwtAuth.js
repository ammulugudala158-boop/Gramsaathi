import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'gramsaathi_super_secure_jwt_secret_key_voice_pin_auth_2025';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required. Please login with your Voice-PIN.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token structure' });
    }
    req.user = { userId: decoded.userId, preferredLanguage: decoded.preferredLanguage };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TokenExpired', message: 'Session expired. Please re-enter your PIN.' });
    }
    return res.status(401).json({ error: 'InvalidToken', message: 'Invalid authentication token.' });
  }
}
