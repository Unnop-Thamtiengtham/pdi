import { prisma } from '@/lib/prisma';
import { PdiType } from '@prisma/client';

export const VALID_PDI_TYPES = new Set(Object.values(PdiType));

export async function getChecklistTemplate(modelCode: string, pdiType: PdiType) {
  return prisma.checklistTemplate.findFirst({
    where: { modelCode, pdiType, isActive: true },
    include: {
      items: {
        orderBy: [{ categoryOrder: 'asc' }, { itemOrder: 'asc' }],
      },
    },
  });
}
