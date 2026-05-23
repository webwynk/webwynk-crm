import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const todayStart = startOfDay(new Date());

    const [
      assignedProjectsCount,
      todayAttendance,
      lastSalary,
      recentProjects,
    ] = await Promise.all([
      // Total assigned projects
      prisma.projectAssignment.count({
        where: { userId },
      }),

      // Today's attendance
      prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: todayStart,
          },
        },
      }),

      // Last paid salary
      prisma.salary.findFirst({
        where: { userId, status: 'PAID' },
        orderBy: { paidAt: 'desc' },
      }),

      // Recent assigned projects
      prisma.project.findMany({
        where: {
          assignments: {
            some: { userId },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  designation: true,
                },
              },
            },
          },
          _count: { select: { assignments: true } },
        },
      }),
    ]);

    return NextResponse.json({
      assignedProjectsCount,
      todayAttendance,
      lastSalary,
      recentProjects,
    });
  } catch (error) {
    console.error('[EMPLOYEE_DASHBOARD_STATS]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
