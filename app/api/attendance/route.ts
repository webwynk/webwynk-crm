import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ─── GET: Fetch attendance records ────────────────────────
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month'); // YYYY-MM
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : null;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: Record<string, unknown> = {};

    // Employees can only see their own data
    if (session.user.role === 'EMPLOYEE') {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }

    if (status) where.status = status;

    if (search) {
      where.user = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    if (page !== null) {
      const [attendance, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, avatar: true, designation: true },
            },
          },
        }),
        prisma.attendance.count({ where }),
      ]);
      return NextResponse.json({ data: attendance, total, page, limit });
    } else {
      const attendance = await prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true, designation: true },
          },
        },
      });
      return NextResponse.json(attendance);
    }
  } catch (error) {
    console.error('[ATTENDANCE_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
