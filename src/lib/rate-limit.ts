/**
 * Simple in-memory rate limiter for login protection.
 * Limits attempts per IP address to prevent brute-force attacks.
 * 
 * Note: This uses in-memory storage, so it resets when the server restarts.
 * For production with multiple server instances, consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;        // Max login attempts allowed
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up stale entries every 5 minutes

/**
 * Check if the given identifier (IP address) is rate-limited.
 * Returns { limited: true, retryAfterSeconds } if blocked,
 * or { limited: false } if allowed.
 */
export function checkRateLimit(identifier: string): {
  limited: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    return { limited: false };
  }

  // If the window has expired, reset
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    return { limited: false };
  }

  // Within window — check count
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.firstAttempt);
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Increment count
  entry.count++;
  return { limited: false };
}

/**
 * Reset rate limit for a given identifier (e.g., after successful login).
 */
export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

// Periodic cleanup of expired entries to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of loginAttempts.entries()) {
      if (now - entry.firstAttempt > WINDOW_MS) {
        loginAttempts.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}
