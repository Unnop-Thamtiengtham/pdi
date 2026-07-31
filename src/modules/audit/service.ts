import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

interface LogOptions {
  req?: NextRequest;
  session: {
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: string | null;
    };
  };
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
}

export async function createAuditLog({
  req,
  session,
  action,
  targetType,
  targetId,
  details,
}: LogOptions) {
  try {
    let ipAddress = 'unknown';
    if (req) {
      ipAddress =
        (req.headers.get('x-forwarded-for') as string)?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
    }

    const userWithRole = session.user as { role?: string | null } | undefined;

    return await prisma.auditLog.create({
      data: {
        userId: session.user?.id || null,
        userEmail: session.user?.email || null,
        userName: session.user?.name || null,
        userRole: userWithRole?.role || null,
        action,
        targetType,
        targetId: targetId || null,
        details: details || null,
        ipAddress,
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AuditLog] Failed to write audit log:', errMsg);
  }
}
