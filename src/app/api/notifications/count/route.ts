import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/count — Lightweight endpoint for notification badge count
// Returns only the count + minimal urgent job data (no heavy includes)
export async function GET() {
  try {
    // Count unresolved incoming jobs
    const urgentJobs = await prisma.pdiJob.findMany({
      where: {
        pdiType: 'INCOMING',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        jobNumber: true,
        pdiType: true,
        status: true,
        vehicleVin: true,
        vehicle: {
          select: {
            modelName: true,
            incomingDeadline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      count: urgentJobs.length,
      jobs: urgentJobs,
    });
  } catch (error: any) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json({ count: 0, jobs: [] });
  }
}
