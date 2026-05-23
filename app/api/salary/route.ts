import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/notifications';

// ─── GET: Salary records ──────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (session.user.role === 'EMPLOYEE') {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (month) where.month = month;
    if (status) where.status = status;

    const salaries = await prisma.salary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, designation: true },
        },
      },
    });

    return NextResponse.json(salaries);
  } catch (error) {
    console.error('[SALARY_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Create salary record ───────────────────────────
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, month, amount, note } = body;

    if (!userId || !month || !amount) {
      return NextResponse.json(
        { error: 'userId, month, and amount are required' },
        { status: 400 }
      );
    }

    const salary = await prisma.salary.create({
      data: {
        userId,
        month,
        amount: Number(amount),
        note: note || null,
        createdById: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      actorId: session.user.id,
      actorName: session.user.name || (session.user.role === 'ADMIN' ? 'Admin' : 'HR'),
      actorRole: session.user.role as 'ADMIN' | 'HR',
      action: 'created_salary',
      entityType: 'Salary',
      entityId: salary.id,
      metadata: {
        employeeId: userId,
        employeeName: salary.user.name,
        month,
        amount,
      },
    });

    return NextResponse.json(salary, { status: 201 });
  } catch (error) {
    console.error('[SALARY_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
