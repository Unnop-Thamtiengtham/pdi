import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RepairsClient from './RepairsClient';

export default async function RepairsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Restrict access to roles SUPER_ADMIN and SUPERVISOR
  const userRole = session.user?.role;
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERVISOR') {
    redirect('/');
  }

  let dbJobs: any[] = [];
  let dbBranches: any[] = [];
  let isDbConnected = true;

  try {
    dbJobs = await prisma.pdiJob.findMany({
      where: {
        status: { in: ['DEFECT_FOUND', 'REJECTED'] },
      },
      include: {
        vehicle: {
          include: { branch: true },
        },
        inspector: { select: { id: true, name: true, employeeId: true } },
        defects: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    dbBranches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.warn('Database connection failed in repairs list. Using mock.');
    isDbConnected = false;
  }

  return (
    <RepairsClient
      initialJobs={dbJobs}
      isDbConnected={isDbConnected}
      branches={dbBranches}
    />
  );
}
