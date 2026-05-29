import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';

export async function GET(request) {
  const user = await getUser(request);
  if (!user?.id) {
    return NextResponse.json({ conversations: [] });
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ conversations: [] });
    }

    const { data, error } = await supabase
      .from('queries')
      .select('session_id, message, response, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch conversations error:', error);
      return NextResponse.json({ conversations: [] });
    }

    const sessionMap = {};
    for (const row of data || []) {
      if (!sessionMap[row.session_id]) {
        sessionMap[row.session_id] = {
          id: row.session_id,
          messages: [],
          createdAt: row.created_at,
          updatedAt: row.created_at,
        };
      }

      const convo = sessionMap[row.session_id];
      convo.updatedAt = row.created_at;

      convo.messages.push(
        { role: 'user', content: row.message },
        { role: 'assistant', content: row.response || '' }
      );
    }

    const conversations = Object.values(sessionMap)
      .map((c) => ({
        ...c,
        preview: c.messages[0]?.content?.slice(0, 60) || 'Conversation',
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 50);

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error('Conversations error:', err);
    return NextResponse.json({ conversations: [] });
  }
}

export async function DELETE(request) {
  const user = await getUser(request);
  if (!user?.id) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'session_id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    await supabase
      .from('queries')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete conversation error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
