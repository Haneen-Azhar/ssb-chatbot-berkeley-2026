import { createClient } from '@supabase/supabase-js';
import { getProfile } from './database.js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedSupabase = null;
function getSupabase() {
  if (!url || !anonKey) return null;
  if (!cachedSupabase) {
    cachedSupabase = createClient(url, anonKey);
  }
  return cachedSupabase;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function getUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const token = authHeader.split(' ')[1];

  try {
    let userId = null;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
    } catch { /* JWT decode failed, will get userId from auth response */ }

    const authPromise = withTimeout(supabase.auth.getUser(token), 3000);
    const profilePromise = userId
      ? withTimeout(getProfile(userId), 2000).catch(() => null)
      : null;

    const { data: { user }, error } = await authPromise;
    if (error || !user) return null;

    const profile = profilePromise
      ? await profilePromise
      : await withTimeout(getProfile(user.id), 2000).catch(() => null);
    return { ...user, profile };
  } catch {
    return null;
  }
}

export async function requireAdmin(request) {
  const user = await getUser(request);
  if (!user?.profile?.is_admin) return null;
  return user;
}
