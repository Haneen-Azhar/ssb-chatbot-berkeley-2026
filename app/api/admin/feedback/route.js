import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminFeedback } from '@/lib/database';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session') || null;
    const feedback = await getAdminFeedback(session);
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Admin feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
