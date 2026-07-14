import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
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
    status: 'APPROVED',
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
        inspector: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { approvedAt: 'desc' },
    });
  } catch (error) {
    console.warn('Database connection failed in reports page. Using mock.');
    isDbConnected = false;
  }

  return (
    <div className="space-y-6">
      <ReportsClient
        initialJobs={dbJobs}
        isDbConnected={isDbConnected}
      />
    </div>
  );
}
