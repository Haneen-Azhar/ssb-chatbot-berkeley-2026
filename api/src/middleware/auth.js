import { createClient } from '@supabase/supabase-js';
import { getProfile } from '../services/database.js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Extract Bearer token from the Authorization header.
 * Returns the token string or null if not present/malformed.
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * requireAuth - Express middleware that validates a Supabase JWT
 * and attaches the authenticated user (with profile) to req.user.
 *
 * Returns 401 if no token is provided or the token is invalid.
 * Degrades gracefully if Supabase is not configured.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured — skipping auth validation');
      req.user = null;
      return next();
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const profile = await getProfile(user.id);

    req.user = { ...user, profile };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
}

/**
 * requireAdmin - Express middleware that requires the user to be
 * authenticated AND have admin privileges (profile.is_admin === true).
 *
 * Chains through requireAuth first, then checks admin status.
 * Returns 403 if the user is not an admin.
 */
export async function requireAdmin(req, res, next) {
  try {
    requireAuth(req, res, (err) => {
      if (err) {
        return next(err);
      }

      if (!req.user?.profile?.is_admin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      next();
    });
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
}

/**
 * optionalAuth - Express middleware that attempts to authenticate
 * the user but never blocks the request.
 *
 * If no token is provided or authentication fails, req.user is set
 * to null and the request continues. This allows endpoints to serve
 * both authenticated and unauthenticated users.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured — skipping auth validation');
      req.user = null;
      return next();
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      req.user = null;
      return next();
    }

    const profile = await getProfile(user.id);

    req.user = { ...user, profile };
    next();
  } catch (err) {
    console.error('Optional auth middleware error:', err);
    req.user = null;
    next();
  }
}
