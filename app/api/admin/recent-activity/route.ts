import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, avatar: true, role: true, designation: true },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[RECENT_ACTIVITY]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
