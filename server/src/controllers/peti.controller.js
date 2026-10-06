import { z } from 'zod';
import { db } from '../services/supabase.js';

export const SavePetiSchema = z.object({
  scheme_id: z.string().uuid('Valid Scheme ID required'),
  notes: z.string().optional().default('')
});

/**
 * Get Saved Schemes History from Saathi Peti
 * GET /api/saathi-peti
 * STRICT SECURITY: Requires both valid JWT (authenticateJWT) AND fresh unlock_token (authenticateUnlockToken)
 */
export async function getPetiHistory(req, res) {
  try {
    const userId = req.user.userId;
    const history = await db.getUserPeti(userId);

    // Calculate remaining days for each entry
    const formattedHistory = history.map(item => {
      const expiresAt = new Date(item.expires_at);
      const now = new Date();
      const diffMs = expiresAt - now;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        days_remaining: daysRemaining
      };
    });

    return res.json({
      success: true,
      count: formattedHistory.length,
      history: formattedHistory,
      auto_delete_notice: 'All records in Saathi Peti automatically self-destruct after 30 days for your privacy.'
    });
  } catch (err) {
    console.error('Error fetching Saathi Peti history:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not access Saathi Peti history.'
    });
  }
}

/**
 * Save a Scheme to Saathi Peti
 * POST /api/saathi-peti
 * Requires JWT auth
 */
export async function saveToPeti(req, res) {
  try {
    const parseResult = SavePetiSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Valid scheme_id is required.',
        details: parseResult.error.format()
      });
    }

    const { scheme_id, notes } = parseResult.data;
    const userId = req.user.userId;

    const savedRecord = await db.saveToPeti({
      userId,
      schemeId: scheme_id,
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Scheme securely saved into your Saathi Peti for 30 days.',
      record: savedRecord
    });
  } catch (err) {
    console.error('Error saving to Saathi Peti:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not save scheme to Saathi Peti.'
    });
  }
}

/**
 * Remove an item from Saathi Peti
 * DELETE /api/saathi-peti/:id
 */
export async function removeFromPeti(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const removed = await db.removeFromPeti(userId, id);
    if (!removed) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Item not found in your vault.'
      });
    }

    return res.json({
      success: true,
      message: 'Scheme removed from your Saathi Peti.'
    });
  } catch (err) {
    console.error('Error deleting from Saathi Peti:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not remove item from Saathi Peti.'
    });
  }
}
