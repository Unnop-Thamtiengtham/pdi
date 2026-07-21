import { prisma } from '@/lib/prisma';

export async function getUrgentJobCount(branchFilter?: string) {
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

  return { count: urgentJobs.length, jobs: urgentJobs };
}
