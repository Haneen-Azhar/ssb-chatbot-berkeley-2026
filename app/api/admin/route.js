import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminOverview } from '@/lib/database';

export async function GET(request) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
