import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Run all counts in parallel
    const [
      totalProjects,
      activeProjects,
      totalEmployees,
      todayAttendance,
      pendingSalaries,
      recentProjects,
    ] = await Promise.all([
      // Total projects
      prisma.project.count(),

      // Active or in-progress projects
      prisma.project.count({
        where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
      }),

      // Total non-admin employees
      prisma.user.count({
        where: { role: { in: ['HR', 'EMPLOYEE'] } },
      }),

      // Today's check-ins
      prisma.attendance.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: 'PRESENT',
          checkIn: { not: null },
        },
      }),

      // Pending salaries
      prisma.salary.count({
        where: { status: 'PENDING' },
      }),

      // Recent 4 projects for dashboard preview
      prisma.project.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
          assignments: {
            take: 4,
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          _count: { select: { assignments: true } },
        },
      }),
    ]);

    // Compute attendance rate
    const attendanceRate =
      totalEmployees > 0
        ? Math.round((todayAttendance / totalEmployees) * 100)
        : 0;

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalEmployees,
      todayAttendance,
      attendanceRate,
      pendingSalaries,
      recentProjects,
    });
  } catch (error) {
    console.error('[DASHBOARD_STATS]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
