import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { timingSafeEqual } from 'crypto';

/**
 * Authenticate the request and return the session.
 * Checks NextAuth browser session first, then falls back to Bearer API token.
 * Returns the session if authenticated, or null if not.
 *
 * This replaces the old `checkAuth()` to avoid double `getServerSession()` calls.
 */
export async function requireAuth(req: NextRequest) {
  // 1. Check NextAuth browser session
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return session;
  }

  // 2. Check Bearer API Token
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    const validToken = process.env.API_SECRET_TOKEN;
    if (validToken && isTokenValid(token, validToken)) {
      // Return a minimal session-like object for API token auth
      return {
        user: {
          id: '__api_service__',
          role: 'MASTER',
          name: 'API Service',
          branchId: null,
          branchCode: null,
          branchName: null,
        },
      } as any;
    }
  }

  return null;
}

/**
 * Timing-safe token comparison to prevent timing attacks.
 * Compares two strings using crypto.timingSafeEqual to ensure
 * the comparison takes the same amount of time regardless of
 * how many characters match.
 */
function isTokenValid(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Convenience: return a 401 JSON response.
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Convenience: return a 403 JSON response.
 */
export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
