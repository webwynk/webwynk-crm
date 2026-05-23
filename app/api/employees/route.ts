import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/notifications';

// ─── GET: List all employees ──────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
      where: { role: { in: ['HR', 'EMPLOYEE'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        designation: true,
        bio: true,
        isOnline: true,
        createdAt: true,
        _count: {
          select: {
            assignedProjects: true,
            attendance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('[EMPLOYEES_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Create new employee ────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, designation, role = 'EMPLOYEE', bio } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Validate role
    if (!['HR', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check unique email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Generate temp password
    const tempPassword = 'Welcome@' + Math.random().toString(36).slice(-6).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        designation: designation || null,
        bio: bio || null,
        isFirstLogin: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        bio: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    await logActivity({
      actorId: session.user.id,
      actorName: session.user.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'created_employee',
      entityType: 'User',
      entityId: employee.id,
      metadata: { name: employee.name, role: employee.role },
    });

    // Return employee data + temp password for admin to share
    return NextResponse.json(
      { ...employee, tempPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('[EMPLOYEES_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
