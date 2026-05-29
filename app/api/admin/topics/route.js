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
    const topics = await getAdminTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Admin topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
