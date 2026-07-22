'use client';

import React from 'react';
import { ArrowLeft, Car } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DeliveryDocuments from './DeliveryDocuments';

interface JobDocument {
  id: string;
  jobId: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface DeliveryDocumentsClientProps {
  job: {
    id: string;
    vehicleVin: string;
    jobNumber: string;
    documents?: JobDocument[];
    vehicle?: {
      modelName: string;
      branch?: {
        name: string;
      } | null;
    } | null;
  };
}

export default function DeliveryDocumentsClient({ job }: DeliveryDocumentsClientProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <Link href="/pdi/predelivery">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">เอกสารส่งมอบรถ / Delivery Documents</span>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-0.5">
              ใบงานตรวจรถ: {job.jobNumber}
            </h2>
          </div>
        </div>
      </div>

      {/* Vehicle Info Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-teal" />
            <span>ข้อมูลรถยนต์ / Vehicle Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">รุ่นรถ (Model)</span>
            <span className="text-slate-800 font-bold text-sm block mt-0.5">
              {job.vehicle?.modelName || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">เลขตัวถัง (VIN)</span>
            <span className="font-mono text-slate-800 font-bold text-sm block mt-0.5 select-all">
              {job.vehicleVin}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">สาขา (Branch)</span>
            <span className="text-slate-800 font-bold text-sm block mt-0.5">
              {job.vehicle?.branch?.name || '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Documents Component */}
      <DeliveryDocuments
        jobId={job.id}
        vin={job.vehicleVin}
        jobNumber={job.jobNumber}
        initialDocuments={job.documents || []}
        readOnly={false}
      />
    </div>
  );
}
