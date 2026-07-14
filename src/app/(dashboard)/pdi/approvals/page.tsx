import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Restrict access to roles SUPER_ADMIN, SUPERVISOR and MASTER
  const userRole = session.user?.role;
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERVISOR' && userRole !== 'MASTER') {
    redirect('/');
  }

  let dbJobs: any[] = [];
  let isDbConnected = true;

  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  const jobWhere: any = {
    status: 'PENDING_APPROVAL',
  };
  if (isBranchRestricted) {
    jobWhere.vehicle = { branchId: userBranchId };
  }

  try {
    dbJobs = await prisma.pdiJob.findMany({
      where: jobWhere,
      include: {
        vehicle: {
          include: { branch: true },
        },
        inspector: { select: { id: true, name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.warn('Database connection failed in approvals list. Using mock.');
    isDbConnected = false;
  }

  return (
    <ApprovalsClient
      initialJobs={dbJobs}
      isDbConnected={isDbConnected}
    />
  );
}
