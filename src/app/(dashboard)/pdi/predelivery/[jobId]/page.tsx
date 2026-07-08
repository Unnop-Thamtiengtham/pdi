import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import PdiWorkspaceClient from '@/components/pdi/PdiWorkspaceClient';

export default async function PredeliveryPdiJobPage({
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
          inspector: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          checklistItems: true,
          defects: true,
          documents: true,
        },
      });

      if (job) {
        // Fetch battery results
        const battery = await prisma.batteryTestResult.findUnique({
          where: { jobId },
        });
        job.batteryTestResult = battery;
      }
    }
  } catch (error) {
    console.warn('Database connection failed in predelivery pdi workspace. Using mock.');
    isDbConnected = false;
  }

  if (isDbConnected && !jobId.startsWith('mock-') && !job) {
    notFound();
  }

  return (
    <PdiWorkspaceClient
      jobId={jobId}
      initialJob={job}
      isDbConnected={isDbConnected}
    />
  );
}
