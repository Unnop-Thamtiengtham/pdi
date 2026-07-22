import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import DeliveryDocumentsClient from '@/components/pdi/DeliveryDocumentsClient';

export default async function PredeliveryJobDocumentsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { jobId } = await params;

  let job: any = null;
  let isDbConnected = true;

  try {
    if (!jobId.startsWith('mock-')) {
      job = await prisma.pdiJob.findUnique({
        where: { id: jobId },
        include: {
          vehicle: {
            include: { branch: true },
          },
          documents: true,
        },
      });
    }
  } catch (error) {
    console.warn('Database connection failed in documents page. Using mock.');
    isDbConnected = false;
  }

  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  if (isDbConnected && !jobId.startsWith('mock-')) {
    if (!job) {
      notFound();
    }
    if (isBranchRestricted && job.vehicle?.branchId !== userBranchId) {
      redirect('/');
    }
  }

  // Handle mock fallback if DB is not connected or mock jobId is used
  if (!job) {
    job = {
      id: jobId,
      jobNumber: 'PDI-MOCK-123',
      vehicleVin: 'MOCK-VIN-1234567890',
      documents: [],
      vehicle: {
        modelName: 'AION Y Plus',
        branch: {
          name: 'สาขาจำลอง (Mock Branch)',
        },
      },
    };
  }

  return <DeliveryDocumentsClient job={job} />;
}
