import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PdiListClient from '@/components/pdi/PdiListClient';

export default async function IncomingPdiPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  let dbJobs: any[] = [];
  let isDbConnected = true;

  try {
    dbJobs = await prisma.pdiJob.findMany({
      where: { pdiType: 'INCOMING' },
      include: {
        vehicle: {
          include: { branch: true },
        },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.warn('Database connection failed in incoming pdi. Using mock.');
    isDbConnected = false;
  }

  return (
    <PdiListClient
      pdiType="INCOMING"
      initialJobs={dbJobs}
      isDbConnected={isDbConnected}
    />
  );
}
