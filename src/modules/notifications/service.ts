import { prisma } from '@/lib/prisma';

// ──────────────────────────────────────
// Promise-based Cache for Notification Count
// ──────────────────────────────────────
interface CacheEntry {
  promise: Promise<any>;
  expiresAt: number;
}

const notificationPromiseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

function getCacheKey(branchFilter?: string): string {
  return `notifications:${branchFilter || 'all'}`;
}

export async function getUrgentJobCount(branchFilter?: string) {
  const cacheKey = getCacheKey(branchFilter);
  const now = Date.now();
  const cached = notificationPromiseCache.get(cacheKey);

  // If we have a cached promise that is still valid, return it directly
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  // Create a new promise to query the database
  const promise = (async () => {
    const where: any = {
      pdiType: 'INCOMING',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    };
    if (branchFilter) {
      where.vehicle = { branchId: branchFilter };
    }

    const urgentJobs = await prisma.pdiJob.findMany({
      where,
      select: {
        id: true,
        jobNumber: true,
        pdiType: true,
        status: true,
        vehicleVin: true,
        vehicle: {
          select: {
            vin: true,
            modelName: true,
            incomingDeadline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { count: urgentJobs.length, jobs: urgentJobs };
  })();

  // Cache the promise
  notificationPromiseCache.set(cacheKey, {
    promise,
    expiresAt: now + CACHE_TTL_MS,
  });

  // If database query fails, delete from cache to allow retry
  promise.catch(() => {
    notificationPromiseCache.delete(cacheKey);
  });

  return promise;
}
