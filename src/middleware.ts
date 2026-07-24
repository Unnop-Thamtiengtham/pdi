import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // If the user is authenticated, allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true if the user is authenticated (has a valid JWT token)
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protect all routes EXCEPT:
// - /login (auth page)
// - /api/auth/* (NextAuth endpoints)
// - /api-docs (Swagger docs)
// - Static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (authentication page)
     * - api/auth (NextAuth API routes)
     * - api-docs (Swagger documentation)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg (browser icons)
     * - public folder files
     */
    '/((?!login|api/auth|api-docs|_next/static|_next/image|favicon\\.ico|icon\\.svg|images|file\\.svg|globe\\.svg|next\\.svg|vercel\\.svg|window\\.svg|swagger\\.json).*)',
  ],
};
