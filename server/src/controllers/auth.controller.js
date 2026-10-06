import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../services/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gramsaathi_super_secure_jwt_secret_key_voice_pin_auth_2025';
const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 5;

// In-memory IP rate limiter / lockout map for brute-force protection
const ipAttempts = new Map();

// Zod schemas
export const PinAuthSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  language: z.string().optional().default('en-IN'),
  userId: z.string().optional()
});

export const UnlockPetiSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
});

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local-ip';
}

function checkIpLockout(ip) {
  const record = ipAttempts.get(ip);
  if (!record) return null;

  if (record.lockoutUntil && new Date(record.lockoutUntil) > new Date()) {
    const remainingSeconds = Math.ceil((new Date(record.lockoutUntil) - new Date()) / 1000);
    return remainingSeconds;
  }
  return null;
}

function registerIpFailure(ip) {
  const now = new Date();
  const record = ipAttempts.get(ip) || { attempts: 0, lockoutUntil: null };

  // If lockout expired, reset attempts
  if (record.lockoutUntil && new Date(record.lockoutUntil) <= now) {
    record.attempts = 0;
    record.lockoutUntil = null;
  }

  record.attempts += 1;
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
  }
  ipAttempts.set(ip, record);
  return record;
}

function resetIpAttempts(ip) {
  ipAttempts.delete(ip);
}

/**
 * Register with 4-Digit Voice-PIN
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const parseResult = PinAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'PIN must be exactly 4 numeric digits (e.g. 1234)',
        details: parseResult.error.format()
      });
    }

    const { pin, language = 'en-IN' } = parseResult.data;

    // Hash PIN with bcrypt (10 rounds minimum)
    const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

    // Create user in DB
    const user = await db.createUser({
      pinHash,
      preferredLanguage: language
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, preferredLanguage: user.preferred_language },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully with Voice-PIN.',
      token,
      user: {
        id: user.id,
        preferred_language: user.preferred_language
      },
      secret_prompt: "To see your saved schemes later, say 'Open Saathi Peti' and speak your PIN."
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not create account. Please try again.'
    });
  }
}

/**
 * Login with 4-Digit Voice-PIN
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const parseResult = PinAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'PIN must be exactly 4 numeric digits'
      });
    }

    const { pin, userId } = parseResult.data;
    const ip = getClientIp(req);

    // 1. Check IP-level lockout
    const ipRemaining = checkIpLockout(ip);
    if (ipRemaining !== null) {
      return res.status(429).json({
        error: 'LockedOut',
        message: `Too many wrong PIN attempts. Please wait ${Math.ceil(ipRemaining / 60)} minute(s) before trying again.`,
        lockoutSeconds: ipRemaining
      });
    }

    // 2. Locate User
    let candidateUsers = [];
    if (userId) {
      const specificUser = await db.getUserById(userId);
      if (specificUser) candidateUsers = [specificUser];
    } else {
      candidateUsers = await db.getAllUsers();
    }

    if (!candidateUsers || candidateUsers.length === 0) {
      registerIpFailure(ip);
      return res.status(401).json({
        error: 'InvalidPin',
        message: 'No registered user found with this PIN. If new, please choose Create PIN.'
      });
    }

    // 3. Find matching user by bcrypt comparison
    let authenticatedUser = null;

    for (const u of candidateUsers) {
      // Check user-level lockout
      if (u.lockout_until && new Date(u.lockout_until) > new Date()) {
        const remainingSeconds = Math.ceil((new Date(u.lockout_until) - new Date()) / 1000);
        return res.status(429).json({
          error: 'LockedOut',
          message: `Account is temporarily locked due to 3 wrong attempts. Wait ${Math.ceil(remainingSeconds / 60)} minutes.`,
          lockoutSeconds: remainingSeconds
        });
      }

      const isMatch = await bcrypt.compare(pin, u.pin_hash);
      if (isMatch) {
        authenticatedUser = u;
        break;
      }
    }

    if (!authenticatedUser) {
      const ipRecord = registerIpFailure(ip);
      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - ipRecord.attempts);

      // If specific user was targeted, increment their failed attempts in DB
      if (userId && candidateUsers[0]) {
        const failedCount = (candidateUsers[0].failed_attempts || 0) + 1;
        const updates = { failed_attempts: failedCount };
        if (failedCount >= MAX_FAILED_ATTEMPTS) {
          updates.lockout_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
        }
        await db.updateUser(userId, updates);
      }

      return res.status(401).json({
        error: 'InvalidPin',
        message: attemptsLeft > 0 
          ? `Incorrect PIN. You have ${attemptsLeft} attempt(s) remaining before a 5-minute lockout.`
          : '3 wrong PIN attempts entered. System locked for 5 minutes.',
        attemptsRemaining: attemptsLeft
      });
    }

    // Success! Reset failed attempts
    resetIpAttempts(ip);
    await db.updateUser(authenticatedUser.id, {
      failed_attempts: 0,
      lockout_until: null
    });

    const token = jwt.sign(
      { userId: authenticatedUser.id, preferredLanguage: authenticatedUser.preferred_language },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Login successful via Voice-PIN.',
      token,
      user: {
        id: authenticatedUser.id,
        preferred_language: authenticatedUser.preferred_language
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not process PIN verification.'
    });
  }
}

/**
 * Unlock Saathi Peti (Hidden Vault)
 * POST /api/auth/unlock-peti
 * Requires JWT auth + PIN confirmation
 * Returns short-lived 5-minute unlock token
 */
export async function unlockPeti(req, res) {
  try {
    const parseResult = UnlockPetiSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'A 4-digit PIN is required to unlock Saathi Peti.'
      });
    }

    const { pin } = parseResult.data;
    const userId = req.user.userId;

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'UserNotFound', message: 'User account not found.' });
    }

    // Check user lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingSeconds = Math.ceil((new Date(user.lockout_until) - new Date()) / 1000);
      return res.status(429).json({
        error: 'LockedOut',
        message: `Vault unlock locked due to repeated incorrect attempts. Please wait ${Math.ceil(remainingSeconds / 60)} minutes.`,
        lockoutSeconds: remainingSeconds
      });
    }

    // Verify PIN
    const isMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!isMatch) {
      const failedCount = (user.failed_attempts || 0) + 1;
      const updates = { failed_attempts: failedCount };
      if (failedCount >= MAX_FAILED_ATTEMPTS) {
        updates.lockout_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      }
      await db.updateUser(userId, updates);

      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - failedCount);
      return res.status(401).json({
        error: 'InvalidPin',
        message: `Incorrect vault PIN. ${attemptsLeft} attempt(s) remaining.`,
        attemptsRemaining: attemptsLeft
      });
    }

    // Reset attempts on successful unlock
    await db.updateUser(userId, { failed_attempts: 0, lockout_until: null });

    // Generate short-lived (5 min) unlock token specifically for Saathi Peti
    const unlockToken = jwt.sign(
      {
        userId: user.id,
        scope: 'saathi_peti_unlock'
      },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    return res.json({
      success: true,
      message: 'Saathi Peti unlocked successfully.',
      unlock_token: unlockToken,
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('Unlock Peti error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not unlock Saathi Peti.'
    });
  }
}

export const UpdateLanguageSchema = z.object({
  language: z.enum(['hi-IN', 'te-IN', 'ta-IN', 'kn-IN', 'en-IN'])
});

/**
 * Get Current User Profile
 * GET /api/auth/profile
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'UserNotFound', message: 'User not found.' });
    }
    return res.json({
      success: true,
      user: {
        id: user.id,
        preferred_language: user.preferred_language,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'ServerError', message: 'Could not fetch profile.' });
  }
}

/**
 * Update User Preferred Language
 * PUT /api/auth/language
 */
export async function updateLanguage(req, res) {
  try {
    const parseResult = UpdateLanguageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Valid language code is required (hi-IN, te-IN, ta-IN, kn-IN, en-IN)'
      });
    }
    const { language } = parseResult.data;
    const userId = req.user.userId;

    const updated = await db.updateUser(userId, { preferred_language: language });
    return res.json({
      success: true,
      message: 'Language preference updated successfully.',
      preferred_language: updated?.preferred_language || language
    });
  } catch (err) {
    console.error('Update language error:', err);
    return res.status(500).json({ error: 'ServerError', message: 'Could not update language preference.' });
  }
}

