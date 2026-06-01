import { createClient } from '@supabase/supabase-js';




const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Database features will be disabled.');
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Fetch a single profile by user ID.
 */
export async function getProfile(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    return null;
  }
}

/**
 * Update a profile by user ID.
 * Allowed fields: name, role, bot_name.
 */
export async function updateProfile(userId, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      console.error('Error updating profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error updating profile:', err.message);
    return null;
  }
}

/**
 * Log a query to the queries table. Never throws.
 */
export async function logQuery({
  userId,
  sessionId,
  message,
  response,
  sources,
  kbResultsCount,
  searchUsed,
  inputTokens,
  outputTokens,
  responseTimeMs,
}) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('queries')
      .insert({
        user_id: userId,
        session_id: sessionId,
        message,
        response,
        sources,
        kb_results_count: kbResultsCount,
        search_used: searchUsed,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_time_ms: responseTimeMs,
      })
      .select()
      .single();
    if (error) {
      console.error('Error logging query:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error logging query:', err.message);
    return null;
  }
}

/**
 * Get admin overview stats: total queries, today, this week, active users, avg response time.
 */
function applySessionFilter(query, sessionFilter) {
  if (sessionFilter === 'all') return query;
  if (sessionFilter) return query.eq('session_label', sessionFilter);
  return query.is('session_label', null); // current session
}

export async function getAdminOverview(sessionFilter = null) {
  if (!supabase) {
    return { totalQueries: 0, queriesToday: 0, queriesThisWeek: 0, activeUsers: 0, avgResponseTimeMs: 0 };
  }
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, todayRes, weekRes, activeRes, avgRes] = await Promise.all([
      applySessionFilter(supabase.from('queries').select('*', { count: 'exact', head: true }), sessionFilter),
      applySessionFilter(supabase.from('queries').select('*', { count: 'exact', head: true }).gte('created_at', todayStart), sessionFilter),
      applySessionFilter(supabase.from('queries').select('*', { count: 'exact', head: true }).gte('created_at', weekStart), sessionFilter),
      applySessionFilter(supabase.from('queries').select('user_id').gte('created_at', weekStart), sessionFilter),
      applySessionFilter(supabase.from('queries').select('response_time_ms'), sessionFilter),
    ]);

    const totalQueries = totalRes.count || 0;
    const queriesToday = todayRes.count || 0;
    const queriesThisWeek = weekRes.count || 0;

    const uniqueUserIds = new Set((activeRes.data || []).map((r) => r.user_id));
    const activeUsers = uniqueUserIds.size;

    const times = (avgRes.data || []).map((r) => r.response_time_ms).filter((t) => t != null);
    const avgResponseTimeMs = times.length > 0
      ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0;

    return { totalQueries, queriesToday, queriesThisWeek, activeUsers, avgResponseTimeMs };
  } catch (err) {
    console.error('Error fetching admin overview:', err.message);
    return { totalQueries: 0, queriesToday: 0, queriesThisWeek: 0, activeUsers: 0, avgResponseTimeMs: 0 };
  }
}

/**
 * Get paginated query list with profile info. Optionally filter by userId and/or role.
 */
export async function getAdminQueries({ page = 1, pageSize = 50, userId, role, sessionFilter = null } = {}) {
  if (!supabase) return { data: [], count: 0 };
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('queries')
      .select('*, profiles(name, role, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    query = applySessionFilter(query, sessionFilter);
    if (userId) query = query.eq('user_id', userId);
    if (role) query = query.eq('profiles.role', role);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching admin queries:', error.message);
      return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.error('Error fetching admin queries:', err.message);
    return { data: [], count: 0 };
  }
}

/**
 * Get all profiles with per-user query counts and last active timestamps.
 */
export async function getAdminUsers(sessionFilter = null) {
  if (!supabase) return [];
  try {
    const [profilesRes, queriesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      applySessionFilter(supabase.from('queries').select('user_id, created_at'), sessionFilter),
    ]);

    if (profilesRes.error) {
      console.error('Error fetching profiles:', profilesRes.error.message);
      return [];
    }
    if (queriesRes.error) {
      console.error('Error fetching queries for users:', queriesRes.error.message);
      return [];
    }

    const profiles = profilesRes.data || [];
    const queries = queriesRes.data || [];

    const userStats = {};
    for (const q of queries) {
      if (!userStats[q.user_id]) {
        userStats[q.user_id] = { queryCount: 0, lastActive: null };
      }
      userStats[q.user_id].queryCount += 1;
      if (!userStats[q.user_id].lastActive || q.created_at > userStats[q.user_id].lastActive) {
        userStats[q.user_id].lastActive = q.created_at;
      }
    }

    return profiles.map((profile) => ({
      ...profile,
      queryCount: userStats[profile.id]?.queryCount || 0,
      lastActive: userStats[profile.id]?.lastActive || null,
    }));
  } catch (err) {
    console.error('Error fetching admin users:', err.message);
    return [];
  }
}

/**
 * Get topic frequency from the sources JSONB column in queries.
 */
export async function getAdminTopics(sessionFilter = null) {
  if (!supabase) return [];
  try {
    const { data, error } = await applySessionFilter(
      supabase.from('queries').select('sources').not('sources', 'is', null),
      sessionFilter
    );

    if (error) {
      console.error('Error fetching topics:', error.message);
      return [];
    }

    const topicCounts = {};
    for (const row of data || []) {
      const sources = row.sources;
      if (!Array.isArray(sources)) continue;
      for (const source of sources) {
        const file = source?.file;
        if (!file) continue;

        let name = file
          .replace(/^scenarios\//, '')
          .replace(/^training\//, 'Training: ')
          .replace(/\.md$/, '')
          .replace(/^\d+[-_]?/, '')
          .replace(/_/g, ' ');

        topicCounts[name] = (topicCounts[name] || 0) + 1;
      }
    }

    return Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error('Error fetching topics:', err.message);
    return [];
  }
}

// ─── Feedback ───────────────────────────────────────────

export async function getAdminFeedback(sessionFilter = null) {
  if (!supabase) return { up: [], down: [] };
  try {
    let query = supabase
      .from('queries')
      .select('message, response, feedback, created_at, profiles(name, role)')
      .not('feedback', 'is', null)
      .order('created_at', { ascending: false });

    query = applySessionFilter(query, sessionFilter);
    const { data, error } = await query;
    if (error) { console.error('getAdminFeedback error:', error); return { up: [], down: [] }; }

    const up = (data || []).filter(r => r.feedback === 'up');
    const down = (data || []).filter(r => r.feedback === 'down');
    return { up, down };
  } catch (err) { console.error('getAdminFeedback error:', err); return { up: [], down: [] }; }
}

// ─── Campus Memory ──────────────────────────────────────

export async function getCampusMemory() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('campus_memory')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getCampusMemory error:', error); return []; }
    return data || [];
  } catch (err) { console.error('getCampusMemory error:', err); return []; }
}

export async function addCampusMemory({ memoryType, title, content, fileName, fileType, uploadedBy }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('campus_memory')
      .insert({
        memory_type: memoryType,
        title,
        content,
        file_name: fileName || null,
        file_type: fileType || null,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();
    if (error) { console.error('addCampusMemory error:', error); return null; }
    return data;
  } catch (err) { console.error('addCampusMemory error:', err); return null; }
}

export async function updateCampusMemory(id, { title, content }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('campus_memory')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updateCampusMemory error:', error); return null; }
    return data;
  } catch (err) { console.error('updateCampusMemory error:', err); return null; }
}

export async function deleteCampusMemory(id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('campus_memory')
      .delete()
      .eq('id', id);
    if (error) { console.error('deleteCampusMemory error:', error); return false; }
    return true;
  } catch (err) { console.error('deleteCampusMemory error:', err); return false; }
}

export async function getCampusMemoryContext() {
  const memories = await getCampusMemory();
  if (!memories.length) return '';

  let context = '\n\n**CAMPUS-SPECIFIC INFORMATION (uploaded by staff):**\n';
  for (const m of memories) {
    context += `\n--- ${m.title} ---\n${m.content}\n`;
  }
  return context;
}

export { supabase };
