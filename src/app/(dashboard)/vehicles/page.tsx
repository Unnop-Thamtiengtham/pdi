import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import VehiclesClient from './VehiclesClient';

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  let dbVehicles: any[] = [];
  let dbBranches: any[] = [];
  let isDbConnected = true;

  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  const vehicleWhere = isBranchRestricted ? { branchId: userBranchId } : {};

  try {
    dbVehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      include: {
        branch: true,
        pdiJobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { arrivedAt: 'desc' },
    });

    dbBranches = await prisma.branch.findMany({
      orderBy: { code: 'asc' },
    });
  } catch (error: any) {
    console.warn('Database connection failed in vehicles page. Using mock data.');
    isDbConnected = false;
  }

  return (
    <div className="space-y-6">
      <VehiclesClient
        initialVehicles={dbVehicles}
        branches={dbBranches}
        isDbConnected={isDbConnected}
      />
    </div>
  );
}
