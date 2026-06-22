'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search, Printer, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime, getPdiRouteSlug } from '@/lib/utils';

interface ReportsClientProps {
  initialJobs: any[];
  isDbConnected: boolean;
}

export default function ReportsClient({ initialJobs, isDbConnected }: ReportsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const mockJobs = [
    {
      id: 'mock-ltm-2',
      jobNumber: 'JO-LTM-20260609-002',
      pdiType: 'LONG_TERM',
      status: 'APPROVED',
      vehicleVin: 'LNAT4AB34T5G05044',
      vehicle: { modelName: 'AION ES', colorName: 'Classic Black' },
      inspector: { name: 'สมชาย ช่างตรวจ' },
      approver: { name: 'ธีรพล QC' },
      approvedAt: '2026-06-08T15:30:00.000Z',
    },
    {
      id: 'mock-inc-4',
      jobNumber: 'JO-INC-20260609-004',
      pdiType: 'INCOMING',
      status: 'APPROVED',
      vehicleVin: 'LNAT4AB34T5G05055',
      vehicle: { modelName: 'GAC M8', colorName: 'Crystal White' },
      inspector: { name: 'สมชาย ช่างตรวจ' },
      approver: { name: 'ธีรพล QC' },
      approvedAt: '2026-06-07T10:00:00.000Z',
    }
  ];

  const jobs = isDbConnected ? initialJobs : mockJobs;

  const filteredJobs = jobs.filter(j => {
    const matchesSearch =
      j.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.vehicle?.modelName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = typeFilter === 'ALL' || j.pdiType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">รายงานประวัติงานตรวจ (PDI Reports History)</h2>
          <p className="text-xs text-slate-500 mt-1">
            รายการตรวจสอบและบำรุงรักษาที่เสร็จสิ้นสมบูรณ์และได้รับอนุมัติจาก QC/Supervisor แล้ว
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-56">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขงาน หรือ VIN..."
              className="pl-9 text-xs"
            />
          </div>

          <Select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="w-full md:w-40 text-xs h-10"
          >
            <option value="ALL">ทุกประเภท (ALL)</option>
            <option value="INCOMING">Incoming PDI</option>
            <option value="LONG_TERM">Long-term Maintenance</option>
            <option value="PRE_DELIVERY">Pre-delivery PDI</option>
          </Select>
        </div>
      </div>

      {/* Reports Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขสั่งงาน (Job No.)</TableHead>
                <TableHead>เลขตัวถัง (VIN)</TableHead>
                <TableHead>รุ่นโมเดล (Model)</TableHead>
                <TableHead>ประเภท (PDI Type)</TableHead>
                <TableHead>ผู้ตรวจ (Inspector)</TableHead>
                <TableHead>ผู้อนุมัติ (QC)</TableHead>
                <TableHead>วันที่อนุมัติ (Approved At)</TableHead>
                <TableHead className="text-right">พิมพ์รายงาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-sm">
                    ไม่พบประวัติข้อมูลรายงานที่อนุมัติแล้ว
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-slate-800 font-medium select-all">{job.jobNumber}</TableCell>
                    <TableCell className="font-mono text-xs select-all">{job.vehicleVin}</TableCell>
                    <TableCell className="text-xs">{job.vehicle?.modelName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {job.pdiType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{job.inspector?.name || '-'}</TableCell>
                    <TableCell className="text-xs">{job.approver?.name || '-'}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {formatDateTime(job.approvedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/pdi/${getPdiRouteSlug(job.pdiType)}/${job.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5 gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>ดูผล</span>
                          </Button>
                        </Link>
                      </div>
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
