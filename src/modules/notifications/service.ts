import { prisma } from '@/lib/prisma';

// ──────────────────────────────────────
// In-memory Cache for Notification Count
// ──────────────────────────────────────
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const notificationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

function getCacheKey(branchFilter?: string): string {
  return `notifications:${branchFilter || 'all'}`;
}

export async function getUrgentJobCount(branchFilter?: string) {
  // Check cache first
  const cacheKey = getCacheKey(branchFilter);
  const cached = notificationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

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
        select: { modelName: true, incomingDeadline: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const result = { count: urgentJobs.length, jobs: urgentJobs };

  // Store in cache
  notificationCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}
