import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import VehicleDetailClient from './VehicleDetailClient';

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { vin } = await params;

  let vehicle: any = null;
  let branches: any[] = [];
  let isDbConnected = true;

  try {
    vehicle = await prisma.vehicle.findUnique({
      where: { vin },
      include: {
        branch: true,
        pdiJobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            inspector: { select: { id: true, name: true } },
            approver: { select: { id: true, name: true } },
          },
        },
        editLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    branches = await prisma.branch.findMany({
      orderBy: { code: 'asc' },
    });
  } catch (error) {
    console.warn('Database connection failed in vehicle detail. Using mock data.');
    isDbConnected = false;
  }

  if (isDbConnected && !vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <VehicleDetailClient
        initialVehicle={vehicle}
        vin={vin}
        isDbConnected={isDbConnected}
        branches={branches}
      />
    </div>
  );
}
