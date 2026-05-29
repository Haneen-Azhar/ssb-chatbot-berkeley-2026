import { createClient } from '@supabase/supabase-js';
import { getProfile } from './database.js';

export async function getUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  try {
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) { console.error('Auth getUser error:', error.message); return null; }
    if (!user) { console.log('Auth: no user from token'); return null; }

    const profile = await getProfile(user.id);
    console.log('Auth resolved:', user.email, 'profile:', profile?.name || 'no profile');
    return { ...user, profile };
  } catch (err) {
    console.error('Auth catch:', err.message);
    return null;
  }
}

export async function requireAdmin(request) {
  const user = await getUser(request);
  if (!user?.profile?.is_admin) return null;
  return user;
}
