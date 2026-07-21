import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

// ──────────────────────────────────────
// GET — List all users (MASTER only)
// ──────────────────────────────────────
export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      branchId: true,
      branch: { select: { name: true, code: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ──────────────────────────────────────
// POST — Create user
// ──────────────────────────────────────
export interface CreateUserInput {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  branchId?: string;
}

export async function createUser(input: CreateUserInput) {
  // Check if employeeId or email already exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ employeeId: input.employeeId }, { email: input.email }] },
  });
  if (existing) return { error: 'User with this Employee ID or Email already exists.', status: 400 };

  // Validate role
  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(input.role as UserRole)) {
    return { error: `Invalid role: ${input.role}`, status: 400 };
  }

  const passwordHash = bcrypt.hashSync(input.password, 10);

  const newUser = await prisma.user.create({
    data: {
      employeeId: input.employeeId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role as UserRole,
      branchId: input.branchId || null,
      isActive: true,
    },
    select: { id: true, employeeId: true, name: true, email: true, role: true },
  });

  return { data: newUser, status: 201 };
}

// ──────────────────────────────────────
// PATCH — Update user
// ──────────────────────────────────────
export interface UpdateUserInput {
  userId: string;
  employeeId?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  branchId?: string;
  isActive?: boolean;
}

export async function updateUser(input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return { error: 'User not found', status: 404 };

  const updateData: any = {};

  if (input.employeeId !== undefined) {
    if (input.employeeId !== user.employeeId) {
      const dup = await prisma.user.findUnique({ where: { employeeId: input.employeeId } });
      if (dup) return { error: 'Employee ID is already in use', status: 400 };
    }
    updateData.employeeId = input.employeeId.trim();
  }
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.email !== undefined) {
    if (input.email && input.email !== user.email) {
      const dup = await prisma.user.findUnique({ where: { email: input.email } });
      if (dup) return { error: 'Email is already in use', status: 400 };
    }
    updateData.email = input.email.trim();
  }
  if (input.password) {
    updateData.passwordHash = bcrypt.hashSync(input.password, 10);
  }
  if (input.role !== undefined) {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(input.role as UserRole)) {
      return { error: `Invalid role: ${input.role}`, status: 400 };
    }
    updateData.role = input.role as UserRole;
  }
  if (input.branchId !== undefined) {
    updateData.branchId = input.role === 'MASTER' || input.role === 'SUPER_ADMIN' ? null : input.branchId || null;
  }
  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  const updatedUser = await prisma.user.update({
    where: { id: input.userId },
    data: updateData,
    select: { id: true, employeeId: true, name: true, email: true, role: true, isActive: true, branchId: true },
  });

  return { data: updatedUser, status: 200 };
}

// ──────────────────────────────────────
// DELETE — Delete user (with linked-job check)
// ──────────────────────────────────────
export async function deleteUser(userId: string) {
  const linkedJobs = await prisma.pdiJob.count({
    where: { OR: [{ inspectorId: userId }, { approverId: userId }] },
  });

  if (linkedJobs > 0) {
    return {
      error: 'ไม่สามารถลบผู้ใช้งานรายนี้ได้ เนื่องจากบัญชีมีประวัติการตรวจสภาพหรืออนุมัติใบงาน PDI ในระบบแล้ว เพื่อป้องกันข้อมูลประวัติสูญหาย กรุณาใช้วิธีเปลี่ยนสถานะเป็น "ระงับการใช้งาน" แทน',
      status: 400,
    };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { data: { message: 'ลบผู้ใช้งานสำเร็จแล้ว' }, status: 200 };
}
