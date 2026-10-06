import { z } from 'zod';
import { db } from '../services/supabase.js';
import { matchSchemesWithGemini, checkDocumentWithGemini } from '../services/gemini.js';

// Zod validation schemas
export const MatchRequestSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  language: z.string().default('en-IN')
});

export const DocumentUploadSchema = z.object({
  image_base64: z.string().startsWith('data:image/', 'Invalid image base64 format'),
  language: z.string().optional().default('en-IN')
});

/**
 * List all available schemes
 * GET /api/schemes
 */
export async function getAllSchemes(req, res) {
  try {
    const { category } = req.query;
    let schemes = await db.getAllSchemes();

    if (category) {
      schemes = schemes.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    return res.json({
      success: true,
      count: schemes.length,
      schemes
    });
  } catch (err) {
    console.error('Error fetching schemes:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not fetch government schemes list.'
    });
  }
}

/**
 * Get scheme details by ID
 * GET /api/schemes/:id
 */
export async function getSchemeById(req, res) {
  try {
    const { id } = req.params;
    const scheme = await db.getSchemeById(id);

    if (!scheme) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Government scheme not found.'
      });
    }

    return res.json({
      success: true,
      scheme
    });
  } catch (err) {
    console.error('Error fetching scheme details:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not fetch scheme details.'
    });
  }
}

/**
 * Match schemes via Gemini AI Structured Output
 * POST /api/schemes/match
 * NOTE: Privacy-first: Raw user query is NOT logged or stored in any database.
 */
export async function matchSchemes(req, res) {
  try {
    const parseResult = MatchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Valid spoken or typed query and language are required.',
        details: parseResult.error.format()
      });
    }

    const { query, language } = parseResult.data;

    // 1. Fetch all current schemes from database
    const allSchemes = await db.getAllSchemes();

    // 2. Delegate to Gemini AI with strict Zod structured outputs
    const aiResult = await matchSchemesWithGemini({
      query,
      language,
      schemes: allSchemes
    });

    // 3. Enrich matched schemes with full database records for instant UI rendering
    const enrichedMatches = aiResult.matched_schemes.map(match => {
      const fullScheme = allSchemes.find(s => s.id === match.scheme_id);
      return {
        ...match,
        scheme: fullScheme || null
      };
    }).filter(m => m.scheme !== null);

    return res.json({
      success: true,
      total_matches: enrichedMatches.length,
      matched_schemes: enrichedMatches,
      conversational_audio_response: aiResult.conversational_audio_response
    });
  } catch (err) {
    console.error('Scheme matching error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not complete scheme matching. Please try speaking again.'
    });
  }
}

/**
 * Document Verification via Gemini Vision (Blurriness & Document Type Check)
 * POST /api/schemes/document-check
 * NOTE: Extreme Privacy - Does NOT save to disk or database. Payload explicitly dropped from memory.
 */
export async function documentCheck(req, res) {
  try {
    const parseResult = DocumentUploadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'A valid document image photo is required.',
        details: parseResult.error.format()
      });
    }

    const { image_base64, language = 'en-IN' } = parseResult.data;

    // Call Gemini 2.5 Flash Vision
    const visionResult = await checkDocumentWithGemini({
      imageBase64: image_base64,
      language
    });

    // CRITICAL SECURITY REQUIREMENT:
    // Drop base64 payload immediately from memory after Gemini resolves
    req.body.image_base64 = null;

    return res.json({
      success: true,
      result: visionResult
    });
  } catch (err) {
    // Ensure memory cleanup even on error
    if (req.body) req.body.image_base64 = null;

    console.error('Document check error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Could not analyze document photo. Please ensure camera lens is clean and try again.'
    });
  }
}
