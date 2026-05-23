import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ─── GET: Fetch credentials ───────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only show credentials to assigned employees or admins
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        credentials: true,
        assignments: { select: { userId: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isAssigned = project.assignments.some(
      (a) => a.userId === session.user.id
    );
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAssigned && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(project.credentials || null);
  } catch (error) {
    console.error('[CREDENTIALS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Save or update credentials ────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { assignments: { select: { userId: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (project.type !== 'WEBSITE_DEVELOPMENT') {
      return NextResponse.json(
        { error: 'Credentials only available for Website Development projects' },
        { status: 400 }
      );
    }

    const isAssigned = project.assignments.some(
      (a) => a.userId === session.user.id
    );
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAssigned && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { devUrl, username, password, notes } = body;

    if (!devUrl || !username || !password) {
      return NextResponse.json(
        { error: 'devUrl, username and password are required' },
        { status: 400 }
      );
    }

    const credentials = await prisma.webDevCredentials.upsert({
      where: { projectId: id },
      update: { devUrl, username, password, notes: notes || null },
      create: { projectId: id, devUrl, username, password, notes: notes || null },
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error('[CREDENTIALS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
