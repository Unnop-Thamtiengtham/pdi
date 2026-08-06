import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = new Set(['MASTER']);

function isAuthorized(role?: string) {
  return role && ALLOWED_ROLES.has(role);
}

// GET /api/webhooks
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  if (!isAuthorized(session.user?.role)) {
    return NextResponse.json({ error: 'Forbidden: เฉพาะผู้ดูแลระบบระดับสูงเท่านั้น' }, { status: 403 });
  }

  try {
    const webhooks = await prisma.webhookSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(webhooks);
  } catch (error: unknown) {
    console.error('Error fetching webhooks:', error);
    return safeErrorResponse(error);
  }
}

// POST /api/webhooks
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  if (!isAuthorized(session.user?.role)) {
    return NextResponse.json({ error: 'Forbidden: เฉพาะผู้ดูแลระบบระดับสูงเท่านั้น' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, url, secret, isActive } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Missing required fields: name, url' }, { status: 400 });
    }

    const newWebhook = await prisma.webhookSetting.create({
      data: {
        name,
        url,
        secret: secret || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(newWebhook, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating webhook:', error);
    return safeErrorResponse(error);
  }
}

// PUT /api/webhooks
export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  if (!isAuthorized(session.user?.role)) {
    return NextResponse.json({ error: 'Forbidden: เฉพาะผู้ดูแลระบบระดับสูงเท่านั้น' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, url, secret, isActive } = body;

    if (!id || !name || !url) {
      return NextResponse.json({ error: 'Missing required fields: id, name, url' }, { status: 400 });
    }

    const updatedWebhook = await prisma.webhookSetting.update({
      where: { id },
      data: {
        name,
        url,
        secret: secret === '' ? null : secret,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedWebhook);
  } catch (error: unknown) {
    console.error('Error updating webhook:', error);
    return safeErrorResponse(error);
  }
}

// DELETE /api/webhooks
export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  if (!isAuthorized(session.user?.role)) {
    return NextResponse.json({ error: 'Forbidden: เฉพาะผู้ดูแลระบบระดับสูงเท่านั้น' }, { status: 403 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing parameter: id' }, { status: 400 });
    }

    const deleted = await prisma.webhookSetting.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'ลบการเชื่อมต่อ Webhook สำเร็จ',
      id: deleted.id,
      name: deleted.name,
    });
  } catch (error: unknown) {
    console.error('Error deleting webhook:', error);
    return safeErrorResponse(error);
  }
}
