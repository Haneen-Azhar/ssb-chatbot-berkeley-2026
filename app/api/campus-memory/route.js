import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getCampusMemory, addCampusMemory, updateCampusMemory, deleteCampusMemory } from '@/lib/database';

export async function GET(request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memories = await getCampusMemory();
  return NextResponse.json({ memories });
}

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, title, content, fileName, fileType } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
    }

    const memory = await addCampusMemory({
      memoryType: type || 'text_block',
      title,
      content,
      fileName,
      fileType,
      uploadedBy: user.id,
    });

    if (!memory) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ memory });
  } catch (err) {
    console.error('POST campus-memory error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, title, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json({ error: 'ID, title, and content required' }, { status: 400 });
    }

    const memory = await updateCampusMemory(id, { title, content });
    if (!memory) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ memory });
  } catch (err) {
    console.error('PUT campus-memory error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const success = await deleteCampusMemory(id);
  return NextResponse.json({ success });
}
