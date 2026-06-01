import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const user = await getUser(request);
    const { messageId, helpful } = await request.json();

    const supabase = createServerClient();
    if (supabase && user?.id) {
      // Find the most recent query matching this user and update feedback
      // messageId is the message index, so we use it with user_id to find the right query
      const { data: queries } = await supabase
        .from('queries')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (queries && queries[messageId]) {
        await supabase
          .from('queries')
          .update({ feedback: helpful ? 'up' : 'down' })
          .eq('id', queries[messageId].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
