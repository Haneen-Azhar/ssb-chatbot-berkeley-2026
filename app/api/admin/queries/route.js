import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminQueries } from '@/lib/database';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const user_id = searchParams.get('user_id') || undefined;
    const role = searchParams.get('role') || undefined;

    const session = searchParams.get('session') || null;
    const result = await getAdminQueries({ page, pageSize, userId: user_id, role, sessionFilter: session });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin queries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
