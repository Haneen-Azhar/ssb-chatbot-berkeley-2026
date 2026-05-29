import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { updateProfile } from '@/lib/database';

export async function GET(request) {
  const user = await getUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({ profile: user.profile });
}

export async function PUT(request) {
  const user = await getUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { name, role, bot_name } = await request.json();

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (bot_name !== undefined) updates.bot_name = bot_name;

    const updated = await updateProfile(user.id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
