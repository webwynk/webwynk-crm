import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, createNotification } from '@/lib/notifications';

// ─── PATCH: Update salary record ──────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, amount, note, paidAt } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (note !== undefined) updateData.note = note;
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;

    const salary = await prisma.salary.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Log and notify on payment
    if (status === 'PAID') {
      await logActivity({
        actorId: session.user.id,
        actorName: session.user.name || (session.user.role === 'ADMIN' ? 'Admin' : 'HR'),
        actorRole: session.user.role as 'ADMIN' | 'HR',
        action: 'salary_paid',
        entityType: 'Salary',
        entityId: id,
        metadata: {
          employeeId: salary.userId,
          employeeName: salary.user.name,
          month: salary.month,
          amount: salary.amount,
        },
      });

      await createNotification({
        userId: salary.userId,
        title: '💰 Salary Received',
        body: `Your salary of ₹${salary.amount} for ${salary.month} has been paid`,
        type: 'SALARY_PAID',
        link: `/employee/salary`,
      });
    }

    return NextResponse.json(salary);
  } catch (error) {
    console.error('[SALARY_PATCH]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE: Remove salary record ─────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.salary.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SALARY_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
