import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';

// GET: list all session labels
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('queries')
      .select('session_label')
      .not('session_label', 'is', null);

    if (error) throw error;

    const labels = [...new Set((data || []).map(r => r.session_label))].sort();
    return NextResponse.json({ sessions: labels });
  } catch (err) {
    console.error('List sessions error:', err);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

// POST: end current session (label all unlabeled queries)
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { label } = await request.json();
    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Session label required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Count how many queries will be archived
    const { count } = await supabase
      .from('queries')
      .select('id', { count: 'exact', head: true })
      .is('session_label', null);

    if (!count || count === 0) {
      return NextResponse.json({ error: 'No queries in current session to archive' }, { status: 400 });
    }

    // Label all unlabeled queries
    const { error } = await supabase
      .from('queries')
      .update({ session_label: label.trim() })
      .is('session_label', null);

    if (error) throw error;

    return NextResponse.json({ success: true, archived: count, label: label.trim() });
  } catch (err) {
    console.error('End session error:', err);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
