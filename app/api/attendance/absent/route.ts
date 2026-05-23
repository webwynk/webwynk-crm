import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/notifications';

// ─── POST: Mark an employee as absent ────────────────────
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'HR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, date, note, forceOverride = false } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);

    // Check for existing check-in record
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: targetDate } },
      include: { user: { select: { name: true } } },
    });

    if (existing && existing.checkIn && !forceOverride) {
      return NextResponse.json(
        {
          error: 'Employee already checked in',
          requiresOverride: true,
          employeeName: existing.user.name,
        },
        { status: 409 }
      );
    }

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: targetDate } },
      update: {
        status: 'ABSENT',
        checkIn: null,
        checkOut: null,
        workHours: null,
        markedAbsentById: session.user.id,
        note: note || null,
      },
      create: {
        userId,
        date: targetDate,
        status: 'ABSENT',
        markedAbsentById: session.user.id,
        note: note || null,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    await logActivity({
      actorId: session.user.id,
      actorName: session.user.name || 'HR/Admin',
      actorRole: session.user.role as 'ADMIN' | 'HR',
      action: 'marked_absent',
      entityType: 'Attendance',
      entityId: record.id,
      metadata: { employeeId: userId, employeeName: record.user.name, date },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('[ATTENDANCE_ABSENT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
