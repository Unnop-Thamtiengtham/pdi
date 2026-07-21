'use client';

import { useState } from 'react';

interface UseApprovalsOptions {
  initialJobs: any[];
  isDbConnected: boolean;
}

export function useApprovals({ initialJobs, isDbConnected }: UseApprovalsOptions) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fallback mock data when DB is not connected
  const getMockJobs = () => {
    return [
      {
        id: 'mock-approve-1',
        jobNumber: 'JO-INC-20260626-4726',
        pdiType: 'INCOMING',
        status: 'PENDING_APPROVAL',
        vehicleVin: 'LNAT4AB34T5G05101',
        vehicle: { modelName: 'AION V', colorName: 'Space Gray', branch: { name: 'มีนบุรี' } },
        inspector: { name: 'สมชาย ช่างตรวจ' },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-approve-2',
        jobNumber: 'JO-LTM-20260626-9305',
        pdiType: 'LONG_TERM',
        ltmInterval: 30,
        status: 'PENDING_APPROVAL',
        vehicleVin: 'LNAT4AB34T5G05102',
        vehicle: { modelName: 'AION Y Plus', colorName: 'Pearl White', branch: { name: 'มีนบุรี' } },
        inspector: { name: 'วิชัย ช่างตรวจ' },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-approve-3',
        jobNumber: 'JO-PD-20260626-4499',
        pdiType: 'PRE_DELIVERY',
        status: 'PENDING_APPROVAL',
        vehicleVin: 'LNAT4AB34T5G05104',
        vehicle: { modelName: 'HYPTEC HT', colorName: 'Rose Gold', branch: { name: 'มีนบุรี' } },
        customerName: 'คุณสมเกียรติ ยิ่งใหญ่',
        inspector: { name: 'สมชาย ช่างตรวจ' },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ];
  };

  const jobs = isDbConnected ? initialJobs : getMockJobs();

  // Filter jobs based on search term
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      job.jobNumber.toLowerCase().includes(term) ||
      job.vehicleVin.toLowerCase().includes(term) ||
      (job.vehicle?.modelName && job.vehicle.modelName.toLowerCase().includes(term)) ||
      (job.inspector?.name && job.inspector.name.toLowerCase().includes(term))
    );
  });

  return {
    searchTerm,
    setSearchTerm,
    filteredJobs,
    isDbConnected,
  };
}
