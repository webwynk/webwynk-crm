import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'HR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Run queries in parallel
    const [
      totalEmployees,
      todayAttendance,
      pendingSalariesSummary,
      attendanceWatchlist,
      payrollHighlights,
    ] = await Promise.all([
      // Total non-admin employees (HR + EMPLOYEE)
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

      // Pending salaries: count and sum amount
      prisma.salary.aggregate({
        where: { status: 'PENDING' },
        _count: true,
        _sum: {
          amount: true,
        },
      }),

      // Today's check-ins for the watchlist
      prisma.attendance.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          checkIn: { not: null },
        },
        orderBy: { checkIn: 'desc' },
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
      }),

      // Payroll highlights (unpaid salary records)
      prisma.salary.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
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
        take: 10,
      }),
    ]);

    const attendanceRate =
      totalEmployees > 0
        ? Math.round((todayAttendance / totalEmployees) * 100)
        : 0;

    return NextResponse.json({
      totalEmployees,
      todayAttendance,
      attendanceRate,
      pendingSalariesAmount: pendingSalariesSummary._sum.amount ?? 0,
      pendingSalariesCount: pendingSalariesSummary._count ?? 0,
      attendanceWatchlist,
      payrollHighlights,
    });
  } catch (error) {
    console.error('[HR_DASHBOARD_STATS]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
