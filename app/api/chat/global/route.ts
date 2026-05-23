import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ─── GET: Fetch last 50 global messages ──────────────────
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await prisma.globalMessage.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            designation: true,
          },
        },
      },
    });

    // Reverse to return in chronological order
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('[GLOBAL_CHAT_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Post a new global message ────────────────────
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, mediaUrl } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Content or media is required' }, { status: 400 });
    }

    const message = await prisma.globalMessage.create({
      data: {
        senderId: session.user.id,
        content: content || '',
        mediaUrl: mediaUrl || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('[GLOBAL_CHAT_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
