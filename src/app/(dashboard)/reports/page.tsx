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

  // Restrict access to roles SUPER_ADMIN and SUPERVISOR
  const userRole = session.user?.role;
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERVISOR') {
    redirect('/');
  }

  let dbJobs: any[] = [];
  let isDbConnected = true;

  try {
    dbJobs = await prisma.pdiJob.findMany({
      where: { status: 'APPROVED' },
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
