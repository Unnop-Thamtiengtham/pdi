import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: {
            name: true,
            code: true,
          }
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, name, email, password, role, branchId } = body;

    if (!employeeId || !name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields: employeeId, name, email, password, role' }, { status: 400 });
    }

    // Check if employeeId or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId },
          { email },
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this Employee ID or Email already exists.' }, { status: 400 });
    }

    // Validate role is a valid enum value
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        employeeId,
        name,
        email,
        passwordHash,
        role: role as UserRole,
        branchId: branchId || null,
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
