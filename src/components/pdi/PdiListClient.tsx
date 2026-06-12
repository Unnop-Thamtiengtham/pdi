'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Play, ShieldAlert, ArrowUpRight, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface PdiListClientProps {
  pdiType: 'INCOMING' | 'LONG_TERM' | 'PRE_DELIVERY';
  initialJobs: any[];
  isDbConnected: boolean;
}

export default function PdiListClient({ pdiType, initialJobs, isDbConnected }: PdiListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom mock fallbacks based on PDI type
  const getMockJobs = () => {
    const today = new Date();
    if (pdiType === 'INCOMING') {
      return [
        {
          id: 'mock-inc-1',
          jobNumber: 'JO-INC-20260609-001',
          pdiType: 'INCOMING',
          status: 'PENDING',
          vehicleVin: 'LNAT4AB34T5G05011',
          vehicle: { modelName: 'AION V', colorName: 'Space Gray', incomingDeadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString() },
          inspector: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-inc-2',
          jobNumber: 'JO-INC-20260609-002',
          pdiType: 'INCOMING',
          status: 'PENDING_APPROVAL',
          vehicleVin: 'LNAT4AB34T5G05022',
          vehicle: { modelName: 'HYPTEC HT', colorName: 'Rose Gold', incomingDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString() },
          inspector: { name: 'สมชาย ช่างตรวจ' },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        }
      ];
    }
    if (pdiType === 'LONG_TERM') {
      return [
        {
          id: 'mock-ltm-1',
          jobNumber: 'JO-LTM-20260609-001',
          pdiType: 'LONG_TERM',
          ltmInterval: 30,
          status: 'IN_PROGRESS',
          vehicleVin: 'LNAT4AB34T5G05033',
          vehicle: { modelName: 'AION Y Plus', colorName: 'Lucky Gold' },
          inspector: { name: 'สมชาย ช่างตรวจ' },
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-ltm-2',
          jobNumber: 'JO-LTM-20260609-002',
          pdiType: 'LONG_TERM',
          ltmInterval: 60,
          status: 'APPROVED',
          vehicleVin: 'LNAT4AB34T5G05044',
          vehicle: { modelName: 'AION ES', colorName: 'Classic Black' },
          inspector: { name: 'สมชาย ช่างตรวจ' },
          scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
    }
    return [
      {
        id: 'mock-pd-1',
        jobNumber: 'JO-PD-20260609-001',
        pdiType: 'PRE_DELIVERY',
        status: 'PENDING',
        vehicleVin: 'LNAT4AB34T5G05055',
        vehicle: { modelName: 'HYPTEC SSR', colorName: 'Flame Red' },
        customerName: 'คุณสมศักดิ์ รวยยศ',
        salesName: 'สุดสวย บริการดี',
        targetDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        inspector: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'mock-pd-2',
        jobNumber: 'JO-PD-20260609-002',
        pdiType: 'PRE_DELIVERY',
        status: 'IN_PROGRESS',
        vehicleVin: 'LNAT4AB34T5G05066',
        vehicle: { modelName: 'GAC M8', colorName: 'Pearl White' },
        customerName: 'คุณอารีย์ มั่งมี',
        salesName: 'ชื่นใจ ยิ้มแย้ม',
        targetDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        inspector: { name: 'สมชาย ช่างตรวจ' },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      }
    ];
  };

  const jobs = isDbConnected ? initialJobs : getMockJobs();

  // Filter based on search term
  const filteredJobs = jobs.filter(j => 
    j.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.vehicle?.modelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTitle = () => {
    switch (pdiType) {
      case 'INCOMING': return 'งานตรวจรับรถลงเรือ (Incoming PDI)';
      case 'LONG_TERM': return 'งานบำรุงรักษารถค้างสต็อก (Long-term Maintenance)';
      case 'PRE_DELIVERY': return 'งานตรวจสภาพก่อนส่งมอบลูกค้า (Pre-delivery PDI)';
    }
  };

  const getDescription = () => {
    switch (pdiType) {
      case 'INCOMING': return 'ช่างตรวจรถลงจากท่าเรือภายใน 24 ชั่วโมง เพื่อบันทึกความสมบูรณ์และใช้สิทธิ์เคลมความบกพร่อง';
      case 'LONG_TERM': return 'ตรวจสอบบำรุงรักษาแบบวนรอบ ทุก 30 / 60 / 90 วัน เพื่อรักษาความสมบูรณ์ของแบตเตอรี่ 12V และตัวรถค้างสต็อก';
      case 'PRE_DELIVERY': return 'การตรวจขั้นสุดท้ายก่อนส่งมอบรถยนต์ไฟฟ้าให้แก่ลูกค้า พร้อมแบบยินยอม PDPA';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">{getTitle()}</h2>
          <p className="text-xs text-slate-500 mt-1">{getDescription()}</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขงาน หรือ VIN..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขสั่งงาน (Job No.)</TableHead>
                <TableHead>เลขตัวถัง (VIN)</TableHead>
                <TableHead>รุ่นโมเดล (Model)</TableHead>
                <TableHead>สถานะตรวจ</TableHead>
                
                {/* Dynamic Headers based on PDI Type */}
                {pdiType === 'INCOMING' && <TableHead>กำหนด SLA (24h)</TableHead>}
                {pdiType === 'LONG_TERM' && (
                  <>
                    <TableHead>รอบตรวจ (Interval)</TableHead>
                    <TableHead>วันที่ครบกำหนด</TableHead>
                  </>
                )}
                {pdiType === 'PRE_DELIVERY' && (
                  <>
                    <TableHead>ชื่อลูกค้า (PDPA)</TableHead>
                    <TableHead>ผู้รับผิดชอบขาย</TableHead>
                    <TableHead>วันส่งมอบรถ</TableHead>
                  </>
                )}

                <TableHead>ช่างผู้ตรวจ</TableHead>
                <TableHead className="text-right">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={pdiType === 'LONG_TERM' ? 8 : pdiType === 'PRE_DELIVERY' ? 9 : 7}
                    className="text-center py-12 text-slate-500 text-sm"
                  >
                    ไม่พบรายการงานตรวจที่สอดคล้อง
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-slate-800 font-medium select-all">{job.jobNumber}</TableCell>
                    <TableCell className="font-mono text-xs select-all">{job.vehicleVin}</TableCell>
                    <TableCell className="text-xs">{job.vehicle?.modelName}</TableCell>
                    <TableCell>
                      {job.status === 'PENDING' && <Badge variant="default">รอตรวจ</Badge>}
                      {job.status === 'IN_PROGRESS' && <Badge variant="info">กำลังตรวจ</Badge>}
                      {job.status === 'DEFECT_FOUND' && <Badge variant="danger">พบจุดชำรุด</Badge>}
                      {job.status === 'PENDING_APPROVAL' && <Badge variant="warning">รอ QC</Badge>}
                      {job.status === 'APPROVED' && <Badge variant="success">ผ่านตรวจ</Badge>}
                      {job.status === 'REJECTED' && <Badge variant="danger">ถูก Reject</Badge>}
                    </TableCell>

                    {/* Dynamic Columns */}
                    {pdiType === 'INCOMING' && (
                      <TableCell className="text-xs text-error font-mono">
                        {new Date(job.vehicle?.incomingDeadline || job.scheduledDate).toLocaleString('th-TH')}
                      </TableCell>
                    )}
                    {pdiType === 'LONG_TERM' && (
                      <>
                        <TableCell>
                          <Badge variant="outline" className="text-brand-teal border-brand-teal/20">
                            {job.ltmInterval} วัน
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('th-TH') : '-'}
                        </TableCell>
                      </>
                    )}
                    {pdiType === 'PRE_DELIVERY' && (
                      <>
                        <TableCell className="text-xs font-semibold">
                          {job.customerName ? `${job.customerName.charAt(0)}***` : 'ไม่ระบุ'}
                        </TableCell>
                        <TableCell className="text-xs">{job.salesName || '-'}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-800">
                          {job.targetDeliveryDate ? new Date(job.targetDeliveryDate).toLocaleDateString('th-TH') : '-'}
                        </TableCell>
                      </>
                    )}

                    <TableCell className="text-xs">{job.inspector?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/pdi/${pdiType.toLowerCase()}/${job.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5">
                          {job.status === 'APPROVED' ? 'ดูรายละเอียด' : 'ลงบันทึกตรวจ'}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
