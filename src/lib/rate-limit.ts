import { prisma } from './prisma';

const MAX_ATTEMPTS = 5;        // Max login attempts allowed
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

/**
 * Check if the given IP address is rate-limited.
 * Returns { limited: true, retryAfterSeconds } if blocked,
 * or { limited: false } if allowed.
 */
export async function checkRateLimit(ip: string): Promise<{
  limited: boolean;
  retryAfterSeconds?: number;
}> {
  const now = new Date();
  
  // Find or create the login attempt record for this IP
  let attempt = await prisma.loginAttempt.findUnique({
    where: { ip },
  });

  if (!attempt) {
    await prisma.loginAttempt.create({
      data: {
        ip,
        attempts: 1,
      },
    });
    return { limited: false };
  }

  // If currently blocked, check if the block duration has expired
  if (attempt.blockedUntil && attempt.blockedUntil > now) {
    const retryAfterMs = attempt.blockedUntil.getTime() - now.getTime();
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  // If the window has expired since the last update, reset the attempts counter
  const timeSinceLastUpdate = now.getTime() - attempt.updatedAt.getTime();
  if (timeSinceLastUpdate > WINDOW_MS) {
    await prisma.loginAttempt.update({
      where: { ip },
      data: {
        attempts: 1,
        blockedUntil: null,
      },
    });
    return { limited: false };
  }

  // If the limit is reached, set a block timer
  if (attempt.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(now.getTime() + WINDOW_MS);
    await prisma.loginAttempt.update({
      where: { ip },
      data: {
        blockedUntil,
      },
    });
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  // Increment attempt counter
  await prisma.loginAttempt.update({
    where: { ip },
    data: {
      attempts: attempt.attempts + 1,
    },
  });

  return { limited: false };
}

/**
 * Reset rate limit for a given IP address (e.g. after successful login).
 */
export async function resetRateLimit(ip: string): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({
      where: { ip },
    });
  } catch (err) {
    // Ignore error if record already deleted
  }
}
