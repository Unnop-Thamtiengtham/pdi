import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vins } = body;

    if (!vins || !Array.isArray(vins) || vins.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameter: vins' }, { status: 400 });
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const results = await prisma.$transaction(async (tx) => {
      const jobs = [];

      for (const vin of vins) {
        const vehicle = await tx.vehicle.findUnique({ where: { vin } });
        if (!vehicle) {
          throw new Error(`Vehicle with VIN ${vin} not found`);
        }

        // Check if an INCOMING job already exists for this vehicle
        const existingJob = await tx.pdiJob.findFirst({
          where: {
            vehicleVin: vin,
            pdiType: 'INCOMING',
          },
        });

        if (existingJob) {
          continue;
        }

        const now = new Date();
        const incomingDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour SLA

        // Create job number
        const rand = Math.floor(100000 + Math.random() * 900000);
        const jobNumber = `JO-INC-${todayStr}-${rand}`;

        // 1. Create PdiJob
        const job = await tx.pdiJob.create({
          data: {
            jobNumber,
            pdiType: 'INCOMING',
            status: 'PENDING',
            vehicleVin: vin,
            scheduledDate: incomingDeadline,
          },
        });

        // 2. Update Vehicle deadline & arrivedAt (to start timer now)
        await tx.vehicle.update({
          where: { vin },
          data: {
            arrivedAt: now,
            incomingDeadline,
          },
        });

        jobs.push(job);
      }
      return jobs;
    });

    return NextResponse.json({
      success: true,
      message: `Started incoming PDI for ${results.length} vehicles.`,
      jobsCount: results.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error starting incoming PDI:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
