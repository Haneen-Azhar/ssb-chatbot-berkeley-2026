import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messageId, helpful, comment } = await request.json();

    console.log('Feedback received:', { messageId, helpful, comment });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
