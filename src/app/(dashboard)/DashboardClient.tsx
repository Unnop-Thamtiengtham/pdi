'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Play, ShieldAlert, ArrowUpRight, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardClientProps {
  initialJobs: any[];
  isDbConnected: boolean;
}

// Custom hook for ticking countdown timer
function useCountdown(deadline: string | Date | null) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const difference = new Date(deadline).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft('EXPIRED');
        setIsUrgent(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}ชั่วโมง ${minutes}นาที ${seconds}วิ`);
      
      // Urgent if less than 2 hours remaining
      if (hours < 2) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return { timeLeft, isUrgent };
}

function SlaTimerRow({ job }: { job: any }) {
  const deadline = job.scheduledDate || job.vehicle?.incomingDeadline;
  const { timeLeft, isUrgent } = useCountdown(deadline);

  if (timeLeft === 'EXPIRED') {
    return (
      <Badge variant="danger" className="animate-pulse">
        EXPIRED (เกิน SLA)
      </Badge>
    );
  }

  return (
    <Badge
      variant={isUrgent ? 'danger' : 'warning'}
      className={isUrgent ? 'animate-pulse font-mono' : 'font-mono'}
    >
      {timeLeft || 'กำลังคำนวณ...'}
    </Badge>
  );
}

export default function DashboardClient({ initialJobs, isDbConnected }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOMING' | 'LONG_TERM' | 'PRE_DELIVERY'>('ALL');

  // Hardcoded premium mock data for fallback
  const mockJobs = [
    {
      id: 'mock-1',
      jobNumber: 'JO-INC-20260609-001',
      pdiType: 'INCOMING',
      status: 'PENDING',
      vehicleVin: 'LNAT4AB34T5G05011',
      vehicle: {
        vin: 'LNAT4AB34T5G05011',
        modelName: 'AION V',
        colorName: 'Space Gray',
        floorplan: 'Zone A',
        incomingDeadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours left
      },
      inspector: null,
      createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-2',
      jobNumber: 'JO-INC-20260609-002',
      pdiType: 'INCOMING',
      status: 'PENDING_APPROVAL',
      vehicleVin: 'LNAT4AB34T5G05022',
      vehicle: {
        vin: 'LNAT4AB34T5G05022',
        modelName: 'HYPTEC HT',
        colorName: 'Rose Gold',
        floorplan: 'Zone B',
        incomingDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // 20 hours left
      },
      inspector: { name: 'สมชาย ช่างตรวจ' },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-3',
      jobNumber: 'JO-PD-20260609-003',
      pdiType: 'PRE_DELIVERY',
      status: 'IN_PROGRESS',
      vehicleVin: 'LNAT4AB34T5G05033',
      vehicle: {
        vin: 'LNAT4AB34T5G05033',
        modelName: 'AION Y Plus',
        colorName: 'Lucky Gold',
        floorplan: 'Handover Bay 1',
        incomingDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
      inspector: { name: 'สมชาย ช่างตรวจ' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-4',
      jobNumber: 'JO-LTM-20260609-004',
      pdiType: 'LONG_TERM',
      status: 'APPROVED',
      vehicleVin: 'LNAT4AB34T5G05044',
      vehicle: {
        vin: 'LNAT4AB34T5G05044',
        modelName: 'GAC M8',
        colorName: 'Crystal White',
        floorplan: 'Stock Lot C',
        incomingDeadline: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
      },
      inspector: { name: 'สมชาย ช่างตรวจ' },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const jobs = isDbConnected ? initialJobs : mockJobs;

  // Statistics calculation
  const totalJobsCount = jobs.length;
  const pendingCount = jobs.filter(j => j.status === 'PENDING').length;
  const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const pendingApprovalCount = jobs.filter(j => j.status === 'PENDING_APPROVAL').length;
  const approvedCount = jobs.filter(j => j.status === 'APPROVED').length;

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(j => {
    if (activeTab === 'ALL') return true;
    return j.pdiType === activeTab;
  });

  // Filter urgent SLA alerts (Incoming PDI pending/in progress with less than 24 hours total)
  const urgentJobs = jobs.filter(j => {
    if (j.pdiType !== 'INCOMING') return false;
    if (j.status === 'APPROVED' || j.status === 'REJECTED') return false;
    return true; // Any unresolved incoming job
  });

  return (
    <div className="space-y-8">
      {/* Page Header Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">แดชบอร์ดภาพรวมการตรวจ (Overview)</h2>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลการตรวจ Incoming PDI, Long-term Maintenance และ Pre-delivery PDI ประจำวันนี้
          </p>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="teal-glow-hover">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">งานรอตรวจทั้งหมด</span>
              <p className="text-2xl font-bold text-slate-800 font-mono">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="teal-glow-hover">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">กำลังตรวจสภาพ</span>
              <p className="text-2xl font-bold text-brand-teal font-mono">{inProgressCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
              <Play className="w-5 h-5 fill-brand-teal/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="teal-glow-hover">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">รอหัวหน้างานอนุมัติ</span>
              <p className="text-2xl font-bold text-warning font-mono">{pendingApprovalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="teal-glow-hover">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">เสร็จสมบูรณ์แล้ว</span>
              <p className="text-2xl font-bold text-success font-mono">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Alert Section */}
      {urgentJobs.length > 0 && (
        <Card className="border border-error/20 bg-error/5">
          <CardHeader className="pb-3 border-b border-error/10">
            <CardTitle className="text-sm font-semibold text-error flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <span>แจ้งเตือนด่วน: รายการรถใกล้ครบกำหนด Incoming PDI SLA (24 ชั่วโมง)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-error/10">
              {urgentJobs.map((job) => (
                <div key={job.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{job.vehicle?.modelName}</span>
                      <span className="text-xs font-mono text-slate-500 font-medium select-all">({job.vehicleVin})</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      โซนจอด: {job.vehicle?.floorplan || 'ไม่ได้ระบุ'} · วันรับรถ: {new Date(job.createdAt).toLocaleString('th-TH')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">เหลือเวลาตรวจ:</span>
                      <SlaTimerRow job={job} />
                    </div>

                    <Link href={`/pdi/${job.pdiType.toLowerCase()}/${job.id}`}>
                      <Button size="sm" className="h-8 gap-1">
                        <span>เริ่มตรวจ</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspace Jobs List Table */}
      <Card>
        <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between border-b border-card-border/50 gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">รายการงานตรวจ PDI ล่าสุด</CardTitle>
            <p className="text-[10px] text-slate-500">ค้นหาและกรองรายการตามประเภทงาน</p>
          </div>

          {/* Filtering Tabs */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-lg">
            {(['ALL', 'INCOMING', 'LONG_TERM', 'PRE_DELIVERY'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-brand-teal text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' && 'ทั้งหมด'}
                {tab === 'INCOMING' && 'Incoming'}
                {tab === 'LONG_TERM' && 'Long-term'}
                {tab === 'PRE_DELIVERY' && 'Pre-delivery'}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่งาน (Job No.)</TableHead>
                <TableHead>รุ่นรถ (Model)</TableHead>
                <TableHead>เลขตัวถัง (VIN)</TableHead>
                <TableHead>ประเภท (PDI Type)</TableHead>
                <TableHead>สถานะ (Status)</TableHead>
                <TableHead>วันครบกำหนด (Deadline)</TableHead>
                <TableHead className="text-right">จัดการ (Action)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    ไม่พบข้อมูลรายการงานตรวจ PDI
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-slate-800 font-medium select-all">{job.jobNumber}</TableCell>
                    <TableCell className="text-xs">{job.vehicle?.modelName}</TableCell>
                    <TableCell className="font-mono text-xs select-all">{job.vehicleVin}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {job.pdiType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.status === 'PENDING' && <Badge variant="default">รอตรวจ</Badge>}
                      {job.status === 'IN_PROGRESS' && <Badge variant="info">กำลังตรวจ</Badge>}
                      {job.status === 'DEFECT_FOUND' && <Badge variant="danger">พบจุดชำรุด</Badge>}
                      {job.status === 'PENDING_APPROVAL' && <Badge variant="warning">รอ QC อนุมัติ</Badge>}
                      {job.status === 'APPROVED' && <Badge variant="success">ผ่านการตรวจ</Badge>}
                      {job.status === 'REJECTED' && <Badge variant="danger">ถูกปฏิเสธ</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('th-TH') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/pdi/${job.pdiType.toLowerCase()}/${job.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs px-2.5">
                          {job.status === 'APPROVED' ? 'ดูรายละเอียด' : 'ทำรายการ'}
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
