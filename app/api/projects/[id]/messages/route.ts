import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ─── GET: Fetch last 50 messages for a project ──────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // HR is not allowed to view project messages
    if (session.user.role === 'HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Employees must be assigned to the project to view messages
    if (session.user.role === 'EMPLOYEE') {
      const assignment = await prisma.projectAssignment.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const messages = await prisma.projectMessage.findMany({
      where: { projectId },
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
    console.error('[PROJECT_MESSAGES_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Post a new message to a project ──────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // HR is not allowed to post messages to projects
    if (session.user.role === 'HR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Employees must be assigned to the project to send messages
    if (session.user.role === 'EMPLOYEE') {
      const assignment = await prisma.projectAssignment.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { content, mediaUrl } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Content or media is required' }, { status: 400 });
    }

    const message = await prisma.projectMessage.create({
      data: {
        projectId,
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
    console.error('[PROJECT_MESSAGES_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
