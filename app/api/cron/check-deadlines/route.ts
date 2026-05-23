import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    // Auth verification
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Fetch projects due tomorrow
    const projects = await prisma.project.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        isDeadlineAlertSent: false,
        dueDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        assignments: true,
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ message: 'No projects due tomorrow.' });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const project of projects) {
      if (!project.dueDate) continue;
      const formattedDate = format(project.dueDate, 'MMM d, yyyy');

      // 1. Notify all Admins
      if (admins.length > 0) {
        await Promise.all(
          admins.map((admin) =>
            createNotification({
              userId: admin.id,
              title: `🔴 ${project.title} is due tomorrow!`,
              body: `Project ${project.title} has a deadline of ${formattedDate}.`,
              type: 'DEADLINE_ALERT',
              link: `/admin/projects/${project.id}`,
            })
          )
        );
      }

      // 2. Notify all assigned employees
      const assigneeIds = project.assignments.map((a) => a.userId);
      if (assigneeIds.length > 0) {
        await Promise.all(
          assigneeIds.map((uid) =>
            createNotification({
              userId: uid,
              title: `🔴 ${project.title} is due tomorrow!`,
              body: `Project ${project.title} has a deadline of ${formattedDate}.`,
              type: 'DEADLINE_ALERT',
              link: `/employee/projects/${project.id}`,
            })
          )
        );
      }

      // 3. Mark alert as sent
      await prisma.project.update({
        where: { id: project.id },
        data: { isDeadlineAlertSent: true },
      });
    }

    return NextResponse.json({
      success: true,
      notifiedProjectsCount: projects.length,
    });
  } catch (error) {
    console.error('[CRON_CHECK_DEADLINES]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
