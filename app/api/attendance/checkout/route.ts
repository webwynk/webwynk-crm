import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, createNotification } from '@/lib/notifications';
import { startOfDay, format } from 'date-fns';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const todayStart = startOfDay(new Date());

    // Fetch user's attendance log for today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No active attendance record found for today. Please check in first.' },
        { status: 400 }
      );
    }

    if (existing.checkOut) {
      return NextResponse.json(
        { error: 'You are already checked out for today.' },
        { status: 400 }
      );
    }

    const checkOutTime = new Date();
    const checkInTime = existing.checkIn;
    let workHours = 0.0;

    if (checkInTime) {
      const diffMs = checkOutTime.getTime() - new Date(checkInTime).getTime();
      workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    // Update attendance record
    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        workHours,
      },
    });

    // Log check-out activity
    await logActivity({
      actorId: userId,
      actorName: session.user.name || 'Team Member',
      actorRole: session.user.role as 'EMPLOYEE' | 'HR' | 'ADMIN',
      action: 'checked_out_attendance',
      entityType: 'Attendance',
      entityId: attendance.id,
      metadata: {
        checkOut: checkOutTime.toISOString(),
        workHours,
      },
    });

    // Notify all HR users
    const hrs = await prisma.user.findMany({
      where: { role: 'HR' },
      select: { id: true },
    });

    const formattedTime = format(checkOutTime, 'hh:mm a');
    for (const hr of hrs) {
      await createNotification({
        userId: hr.id,
        title: 'Attendance Check-Out',
        body: `${session.user.name || 'An employee'} checked out at ${formattedTime}`,
        type: 'ATTENDANCE_CHECKOUT',
        link: '/hr/attendance',
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('[ATTENDANCE_CHECKOUT_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

