import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the X-Powered-By: Next.js header to reduce information leakage
  poweredByHeader: false,

  // Security headers for all routes
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Prevent clickjacking by disallowing iframe embedding
        { key: 'X-Frame-Options', value: 'DENY' },
        // Prevent MIME-type sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // Control referrer information sent with requests
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Restrict browser features
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // Force HTTPS (enable in production)
        // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
  ],
};

export default nextConfig;
