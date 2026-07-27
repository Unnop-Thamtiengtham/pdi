import { prisma } from '@/lib/prisma';
import { PdiType } from '@prisma/client';

export const VALID_PDI_TYPES = new Set(Object.values(PdiType));

// Cache checklist template to prevent redundant database fetches of static master data
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const templateCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export async function getChecklistTemplate(modelCode: string, pdiType: PdiType) {
  const cacheKey = `${modelCode}:${pdiType}`;
  const cached = templateCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const template = await prisma.checklistTemplate.findFirst({
    where: { modelCode, pdiType, isActive: true },
    include: {
      items: {
        orderBy: [{ categoryOrder: 'asc' }, { itemOrder: 'asc' }],
      },
    },
  });

  if (template) {
    templateCache.set(cacheKey, {
      data: template,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  return template;
}
