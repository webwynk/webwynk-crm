import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, createNotification } from '@/lib/notifications';

// ─── GET: Single project ──────────────────────────────────
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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                designation: true,
                email: true,
                role: true,
              },
            },
          },
        },
        credentials: true,
        createdBy: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Security check: Employees can only view a project if they are assigned to it
    if (session.user.role === 'EMPLOYEE') {
      const isAssigned = project.assignments.some(
        (a) => a.userId === session.user.id
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('[PROJECT_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── PATCH: Update project ────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      clientName,
      clientEmail,
      type,
      status,
      progress,
      dueDate,
      startDate,
      coverImage,
      assigneeIds,
    } = body;

    // Fetch original project to verify existence and check permissions
    const projectBefore = await prisma.project.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    });

    if (!projectBefore) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (session.user.role === 'EMPLOYEE') {
      const isAssigned = projectBefore.assignments.some(
        (a) => a.userId === session.user.id
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Employees can only update progress and status
      if (
        title !== undefined ||
        description !== undefined ||
        clientName !== undefined ||
        clientEmail !== undefined ||
        type !== undefined ||
        dueDate !== undefined ||
        startDate !== undefined ||
        coverImage !== undefined ||
        assigneeIds !== undefined
      ) {
        return NextResponse.json(
          { error: 'Forbidden: Employees can only update progress or status' },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    // Handle assignee updates (replace all) - only admins can modify assigneeIds
    if (Array.isArray(assigneeIds) && session.user.role === 'ADMIN') {
      updateData.assignments = {
        deleteMany: {},
        create: assigneeIds.map((uid: string) => ({ userId: uid })),
      };
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    // ─── Trigger Notifications ───────────────────────────────

    // 1. Newly assigned employees (only if updated by admin)
    if (Array.isArray(assigneeIds) && session.user.role === 'ADMIN') {
      const oldAssignees = projectBefore.assignments.map((a) => a.userId);
      const newAssignees = assigneeIds.filter((uid: string) => !oldAssignees.includes(uid));
      if (newAssignees.length > 0) {
        await Promise.all(
          newAssignees.map((uid: string) =>
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
    }

    // 2. Status update by Admin (notify all assigned employees)
    if (status !== undefined && status !== projectBefore.status && session.user.role === 'ADMIN') {
      const currentAssignees = project.assignments.map((a) => a.userId);
      if (currentAssignees.length > 0) {
        await Promise.all(
          currentAssignees.map((uid: string) =>
            createNotification({
              userId: uid,
              title: 'Project Status Updated',
              body: `${project.title} status changed to ${status}`,
              type: 'PROJECT_STATUS_CHANGED',
              link: `/employee/projects/${project.id}`,
            })
          )
        );
      }
    }

    // 3. Project marked as completed by Employee (notify all Admins)
    if (status === 'COMPLETED' && projectBefore.status !== 'COMPLETED' && session.user.role === 'EMPLOYEE') {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      if (admins.length > 0) {
        await Promise.all(
          admins.map((admin) =>
            createNotification({
              userId: admin.id,
              title: 'Project Completed',
              body: `${session.user.name || 'An employee'} marked ${project.title} as completed`,
              type: 'PROJECT_COMPLETED',
              link: `/admin/projects/${project.id}`,
            })
          )
        );
      }
    }

    // Log activity
    const actorName = session.user.name || (session.user.role === 'ADMIN' ? 'Admin' : 'Employee');
    if (status === 'COMPLETED' && projectBefore.status !== 'COMPLETED') {
      await logActivity({
        actorId: session.user.id,
        actorName,
        actorRole: session.user.role as 'ADMIN' | 'EMPLOYEE',
        action: 'project_completed',
        entityType: 'Project',
        entityId: id,
        metadata: { title: project.title },
      });
    } else {
      await logActivity({
        actorId: session.user.id,
        actorName,
        actorRole: session.user.role as 'ADMIN' | 'EMPLOYEE',
        action: 'updated_project',
        entityType: 'Project',
        entityId: id,
        metadata: { title: project.title, status, progress },
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('[PROJECT_PATCH]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE: Remove project ───────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    await logActivity({
      actorId: session.user.id,
      actorName: session.user.name || 'Admin',
      actorRole: session.user.role as 'ADMIN',
      action: 'deleted_project',
      entityType: 'Project',
      entityId: id,
      metadata: { title: project.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PROJECT_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
