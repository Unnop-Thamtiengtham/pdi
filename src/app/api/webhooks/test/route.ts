import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';

// Roles allowed to test webhook connection
const ALLOWED_ROLES = new Set(['MASTER', 'SUPER_ADMIN']);

// POST /api/webhooks/test
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  if (!userRole || !ALLOWED_ROLES.has(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { url, secret } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing required field: url' }, { status: 400 });
    }

    const payload = {
      event: 'pdi.test_connection',
      message: 'This is a test connection from PDI Management System.',
      timestamp: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (secret) {
      headers['Authorization'] = `Bearer ${secret}`;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const resText = await res.text();

      return NextResponse.json({
        success: res.ok,
        status: res.status,
        response: resText.slice(0, 500),
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errMsg = err instanceof Error ? err.message : 'Connection failed';
      return NextResponse.json({
        success: false,
        status: 0,
        response: errMsg,
      });
    }
  } catch (error: unknown) {
    console.error('Error testing webhook connection:', error);
    return safeErrorResponse(error);
  }
}
