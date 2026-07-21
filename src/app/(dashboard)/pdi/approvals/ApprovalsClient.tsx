'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckSquare, ArrowUpRight, Search, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { getPdiRouteSlug } from '@/lib/utils';
import { useApprovals } from './hooks/useApprovals';

interface ApprovalsClientProps {
  initialJobs: any[];
  isDbConnected: boolean;
}

const getPdiTypeBadge = (type: string) => {
  switch (type) {
    case 'INCOMING':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] uppercase font-semibold">Incoming</Badge>;
    case 'LONG_TERM':
      return <Badge className="bg-teal-500 hover:bg-teal-600 text-white text-[10px] uppercase font-semibold">Long-Term</Badge>;
    case 'PRE_DELIVERY':
      return <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] uppercase font-semibold">Pre-Delivery</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function ApprovalsClient({ initialJobs, isDbConnected }: ApprovalsClientProps) {
  const { searchTerm, setSearchTerm, filteredJobs } = useApprovals({ initialJobs, isDbConnected });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">อนุมัติงาน PDI (QC Approvals)</h2>
          <p className="text-xs text-slate-500 mt-1">
            รายการงานตรวจที่รอหัวหน้างาน หรือ QC ตรวจสอบผลและลงลายมือชื่ออนุมัติ
          </p>
        </div>
      </div>

      {/* Mock Indicator */}
      {!isDbConnected && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg flex items-center gap-2.5 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>[Mock Mode] ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ขณะนี้แสดงข้อมูลจำลองเพื่อการทดสอบส่วนการแสดงผล</span>
        </div>
      )}

      {/* Approvals Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-teal" />
            <span>รายการที่รอการตรวจสอบ ({filteredJobs.length} งาน)</span>
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา เลขที่งาน, เลขตัวถัง, รุ่น..."
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                <TableRow>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">เลขที่งาน<br/><span className="text-[10px] text-slate-400 font-normal">(Job No.)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">รุ่นรถ<br/><span className="text-[10px] text-slate-400 font-normal">(Model)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">สาขา<br/><span className="text-[10px] text-slate-400 font-normal">(Branch)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">เลขตัวถัง<br/><span className="text-[10px] text-slate-400 font-normal">(VIN)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ประเภท<br/><span className="text-[10px] text-slate-400 font-normal">(PDI Type)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ช่างตรวจ<br/><span className="text-[10px] text-slate-400 font-normal">(Inspector)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">เวลาส่งอนุมัติ<br/><span className="text-[10px] text-slate-400 font-normal">(Submitted At)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">สถานะ<br/><span className="text-[10px] text-slate-400 font-normal">(Status)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">จัดการ<br/><span className="text-[10px] text-slate-400 font-normal">(Action)</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      ไม่มีงานตรวจที่รออนุมัติในขณะนี้
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 py-4">
                        {job.jobNumber}
                      </TableCell>
                      <TableCell className="text-xs font-semibold py-4">
                        {job.vehicle?.modelName || 'ไม่พบรุ่นรถ'}
                      </TableCell>
                      <TableCell className="text-xs py-4">
                        {job.vehicle?.branch?.name || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 font-medium py-4 select-all">
                        {job.vehicleVin}
                      </TableCell>
                      <TableCell className="py-4">
                        {getPdiTypeBadge(job.pdiType)}
                      </TableCell>
                      <TableCell className="text-xs py-4">
                        {job.inspector?.name || '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500 py-4">
                        {job.completedAt 
                          ? new Date(job.completedAt).toLocaleString('th-TH') 
                          : job.updatedAt 
                          ? new Date(job.updatedAt).toLocaleString('th-TH')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="warning" className="text-[10px] font-semibold px-2 py-0.5">
                          รอ QC อนุมัติ
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Link href={`/pdi/${getPdiRouteSlug(job.pdiType)}/${job.id}`}>
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-8 gap-1 text-xs font-semibold whitespace-nowrap"
                          >
                            <span>ตรวจอนุมัติ</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
