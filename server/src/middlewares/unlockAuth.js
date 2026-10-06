import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'gramsaathi_super_secure_jwt_secret_key_voice_pin_auth_2025';

export function authenticateUnlockToken(req, res, next) {
  const unlockToken = req.headers['x-unlock-token'];

  if (!unlockToken) {
    return res.status(403).json({
      error: 'PetiLocked',
      message: 'Saathi Peti is locked. Voice command and PIN re-entry required to unlock.',
      requireUnlock: true
    });
  }

  try {
    const decoded = jwt.verify(unlockToken, JWT_SECRET);

    if (decoded.scope !== 'saathi_peti_unlock') {
      return res.status(403).json({
        error: 'InvalidUnlockToken',
        message: 'Invalid vault token. Voice PIN re-entry required.',
        requireUnlock: true
      });
    }

    // Must match the authenticated user from authenticateJWT
    if (req.user && req.user.userId !== decoded.userId) {
      return res.status(403).json({
        error: 'UserMismatch',
        message: 'Vault token belongs to another user.',
        requireUnlock: true
      });
    }

    req.petiUnlock = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'UnlockTokenExpired',
      message: 'Vault unlock token has expired (5-minute safety window). Please speak PIN again.',
      requireUnlock: true
    });
  }
}
