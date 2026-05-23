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

    // Check if user already has an attendance log for today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You are already checked in today.' },
        { status: 400 }
      );
    }

    const checkInTime = new Date();

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: todayStart,
        checkIn: checkInTime,
        status: 'PRESENT',
      },
    });

    // Log check-in activity
    await logActivity({
      actorId: userId,
      actorName: session.user.name || 'Team Member',
      actorRole: session.user.role as 'EMPLOYEE' | 'HR' | 'ADMIN',
      action: 'checked_in_attendance',
      entityType: 'Attendance',
      entityId: attendance.id,
      metadata: { checkIn: checkInTime.toISOString() },
    });

    // Notify all HR users
    const hrs = await prisma.user.findMany({
      where: { role: 'HR' },
      select: { id: true },
    });

    const formattedTime = format(checkInTime, 'hh:mm a');
    for (const hr of hrs) {
      await createNotification({
        userId: hr.id,
        title: 'Attendance Check-In',
        body: `${session.user.name || 'An employee'} checked in at ${formattedTime}`,
        type: 'ATTENDANCE_CHECKIN',
        link: '/hr/attendance',
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('[ATTENDANCE_CHECKIN_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

