import { createClient } from '@supabase/supabase-js';
import { getProfile } from './database.js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function getUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  if (!url || !anonKey) return null;

  const token = authHeader.split(' ')[1];

  try {
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await withTimeout(
      supabase.auth.getUser(), 5000
    );
    if (error || !user) return null;

    const profile = await withTimeout(getProfile(user.id), 3000).catch(() => null);
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
