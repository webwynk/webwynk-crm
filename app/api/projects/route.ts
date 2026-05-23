import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, createNotification } from '@/lib/notifications';

// ─── GET: List all projects ───────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Security check: Employees can only view projects they are assigned to
    if (session.user.role === 'EMPLOYEE') {
      where.assignments = { some: { userId: session.user.id } };
    } else if (userId) {
      where.assignments = { some: { userId } };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignments: {
          take: 5,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { assignments: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Create new project ─────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      clientName,
      clientEmail,
      type,
      startDate,
      dueDate,
      coverImage,
      assigneeIds = [],
    } = body;

    if (!title || !clientName || !type || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, clientName, type, startDate' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        clientName,
        clientEmail: clientEmail || null,
        type,
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        coverImage: coverImage || null,
        createdById: session.user.id,
        assignments: {
          create: assigneeIds.map((uid: string) => ({ userId: uid })),
        },
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    // Log activity
    await logActivity({
      actorId: session.user.id,
      actorName: session.user.name || 'Admin',
      actorRole: session.user.role as 'ADMIN',
      action: 'created_project',
      entityType: 'Project',
      entityId: project.id,
      metadata: { title: project.title, type: project.type },
    });

    // Notify assigned employees
    if (assigneeIds && assigneeIds.length > 0) {
      await Promise.all(
        assigneeIds.map((uid: string) =>
          createNotification({
            userId: uid,
            title: `You've been assigned to ${project.title}`,
            body: `You have been assigned as a team member on ${project.title}`,
            type: 'PROJECT_ASSIGNED',
            link: `/employee/projects/${project.id}`,
          })
        )
      );
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
