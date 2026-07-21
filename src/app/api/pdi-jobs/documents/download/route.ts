import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { proxyDownload } from '@/modules/documents/service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session) return unauthorizedResponse();

    const targetUrl = new URL(req.url).searchParams.get('url');
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const allowedEndpoints = [
      'digitaloceanspaces.com',
      process.env.S3_ENDPOINT || 'sgp1.digitaloceanspaces.com',
    ];

    const result = await proxyDownload(targetUrl, allowedEndpoints);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    const headers = new Headers();
    headers.set('Content-Type', result.contentType);
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(result.data as any, { status: 200, headers });
  } catch (error: any) {
    console.error('Error in document download proxy:', error);
    return safeErrorResponse(error);
  }
}
