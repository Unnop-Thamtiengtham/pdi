import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function checkAuth(req: NextRequest): Promise<boolean> {
  // 1. Check NextAuth browser session
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return true;
  }

  // 2. Check Bearer API Token
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    const validToken = process.env.API_SECRET_TOKEN || 'pdi-secret-token-2026';
    if (token === validToken) {
      return true;
    }
  }

  return false;
}
