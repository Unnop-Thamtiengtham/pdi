import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate that the URL is a trusted S3 / DO Spaces URL (or check if it is formatted properly)
    // In our system, S3_ENDPOINT or S3_BUCKET is used, so we can ensure the URL points to our storage.
    const allowedEndpoints = [
      'digitaloceanspaces.com',
      process.env.S3_ENDPOINT || 'sgp1.digitaloceanspaces.com',
    ];

    const urlObj = new URL(targetUrl);
    const isAllowed = allowedEndpoints.some((endpoint) =>
      urlObj.hostname.includes(endpoint.replace('https://', '').replace('http://', ''))
    );

    if (!isAllowed) {
      console.warn('Blocked download proxy request to untrusted domain:', urlObj.hostname);
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the file from S3 server-side
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';

    // Return the binary data to the client
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error in document download proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
