import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { listUsers, createUser, updateUser, deleteUser } from '@/modules/users/service';
import { createAuditLog } from '@/modules/audit/service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session || session.user?.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return safeErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session || session.user?.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    if (!body.employeeId || !body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await createUser(body);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await createAuditLog({
      req,
      session,
      action: 'CREATE_USER',
      targetType: 'User',
      targetId: result.data.id,
      details: `สร้างบัญชีผู้ใช้งานใหม่: ${body.name} (รหัสพนักงาน: ${body.employeeId}) บทบาท: ${body.role}`,
    });

    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return safeErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session || session.user?.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    if (!body.userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const result = await updateUser(body);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await createAuditLog({
      req,
      session,
      action: 'UPDATE_USER',
      targetType: 'User',
      targetId: result.data.id,
      details: `แก้ไขบัญชีผู้ใช้งาน: ${result.data.name} (${result.data.employeeId}) รายการแก้: ${Object.keys(body).filter(k => k !== 'userId').join(', ')}`,
    });

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return safeErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session || session.user?.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const result = await deleteUser(userId);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await createAuditLog({
      req,
      session,
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: result.data.id,
      details: `ลบบัญชีผู้ใช้งานออกจากระบบ: ${result.data.name} (รหัสพนักงาน: ${result.data.employeeId})`,
    });

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return safeErrorResponse(error);
  }
}
