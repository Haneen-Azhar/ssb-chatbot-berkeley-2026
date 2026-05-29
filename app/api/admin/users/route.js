import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminUsers } from '@/lib/database';

export async function GET(request) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const users = await getAdminUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
