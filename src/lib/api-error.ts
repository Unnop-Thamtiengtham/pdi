import { NextResponse } from 'next/server';

/**
 * Return a safe error response that hides internal details in production.
 * In development, the full error message is included for easier debugging.
 */
export function safeErrorResponse(error: any, statusCode = 500) {
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev
    ? (error?.message || 'Internal Server Error')
    : 'Internal Server Error';

  return NextResponse.json({ error: message }, { status: statusCode });
}
