import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminTopics } from '@/lib/database';

export async function GET(request) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session') || null;
    const topics = await getAdminTopics(session);
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Admin topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
