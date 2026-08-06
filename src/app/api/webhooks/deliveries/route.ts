import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = new Set(['MASTER']);

// GET /api/webhooks/deliveries
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  if (!userRole || !ALLOWED_ROLES.has(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const webhookId = req.nextUrl.searchParams.get('webhookId');
    if (!webhookId) {
      return NextResponse.json({ error: 'Missing parameter: webhookId' }, { status: 400 });
    }

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50, // return last 50 dispatches for UI log view
    });

    return NextResponse.json(deliveries);
  } catch (error: unknown) {
    console.error('Error fetching webhook deliveries:', error);
    return safeErrorResponse(error);
  }
}
