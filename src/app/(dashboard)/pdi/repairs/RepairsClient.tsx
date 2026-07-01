'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wrench, Search, ShieldAlert, Calendar, MapPin, ClipboardList, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface RepairsClientProps {
  initialJobs: any[];
  isDbConnected: boolean;
}

export default function RepairsClient({ initialJobs, isDbConnected }: RepairsClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);

  // Dialog / Modal States
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repairDate, setRepairDate] = useState('');
  const [repairLocation, setRepairLocation] = useState('อู่ตัวถังและสี (Body & Paint)');
  const [customLocation, setCustomLocation] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Complete repair confirmation states
  const [confirmJob, setConfirmJob] = useState<any | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Fallback mock data when DB is not connected
  const getMockJobs = () => {
    return [
      {
        id: 'mock-repair-1',
        jobNumber: 'JO-INC-20260626-7875',
        pdiType: 'INCOMING',
        status: 'DEFECT_FOUND',
        vehicleVin: 'LNAT4AB34T5G05303',
        vehicle: { modelName: 'AION UT', colorName: 'Midnight Black', branch: { name: 'มีนบุรี' } },
        inspector: { name: 'สมชาย ช่างตรวจ' },
        defects: [
          { id: 'd1', defectNo: 1, description: 'กระจกมองข้างซ้ายมีรอยขีดข่วน', status: 'OPEN' }
        ],
        updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        sentToRepairAt: null,
        repairLocation: null,
        repairNotes: null,
      },
      {
        id: 'mock-repair-2',
        jobNumber: 'JO-INC-20260626-7707',
        pdiType: 'INCOMING',
        status: 'REJECTED',
        vehicleVin: 'LNAT4AB34T5G05304',
        vehicle: { modelName: 'HYPTEC HT', colorName: 'Rose Gold', branch: { name: 'มีนบุรี' } },
        inspector: { name: 'วิชัย ช่างตรวจ' },
        defects: [
          { id: 'd2', defectNo: 1, description: 'แรงดันลมยางสูงเกินเกณฑ์', status: 'OPEN' },
          { id: 'd3', defectNo: 2, description: 'มีเสียงดังขณะพับเบาะหลัง', status: 'OPEN' }
        ],
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentToRepairAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        repairLocation: 'ฝ่ายเทคนิค/ช่างเครื่องยนต์ (Mechanic/Technical)',
        repairNotes: 'เช็คแรงดันลมยางกับกลไกพับเบาะ',
      },
    ];
  };

  useEffect(() => {
    setJobs(isDbConnected ? initialJobs : getMockJobs());
  }, [initialJobs, isDbConnected]);

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

  const handleOpenRepairModal = (job: any) => {
    setSelectedJob(job);
    
    // Format timestamp for datetime-local (YYYY-MM-DDTHH:MM) in local time zone
    const d = job.sentToRepairAt ? new Date(job.sentToRepairAt) : new Date();
    // Compensate offset to output ISO string in local time
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    
    setRepairDate(localISOTime);
    
    const defaults = [
      'อู่ตัวถังและสี (Body & Paint)',
      'ฝ่ายเทคนิค/ช่างเครื่องยนต์ (Mechanic/Technical)',
      'อู่ภายนอก (External Shop)'
    ];

    if (job.repairLocation) {
      if (defaults.includes(job.repairLocation)) {
        setRepairLocation(job.repairLocation);
        setCustomLocation('');
      } else {
        setRepairLocation('อื่น ๆ');
        setCustomLocation(job.repairLocation);
      }
    } else {
      setRepairLocation('อู่ตัวถังและสี (Body & Paint)');
      setCustomLocation('');
    }
    
    setRepairNotes(job.repairNotes || '');
    setIsModalOpen(true);
  };

  const handleSubmitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSubmitting(true);
    const finalLocation = repairLocation === 'อื่น ๆ' ? customLocation : repairLocation;
    
    // Parse input datetime string to UTC Date object
    const selectedDate = new Date(repairDate);

    const payload = {
      jobId: selectedJob.id,
      sentToRepairAt: selectedDate.toISOString(),
      repairLocation: finalLocation,
      repairNotes: repairNotes,
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save repair info');
        }
        toast.success(selectedJob.sentToRepairAt ? 'อัปเดตข้อมูลส่งซ่อมสำเร็จ' : 'ดำเนินการส่งซ่อมเรียบร้อยแล้ว');
      } else {
        toast.success('[Mock Mode] บันทึกการส่งซ่อมสำเร็จ');
      }

      // Update state locally
      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          j.id === selectedJob.id
            ? {
                ...j,
                sentToRepairAt: payload.sentToRepairAt,
                repairLocation: payload.repairLocation,
                repairNotes: payload.repairNotes,
                defects: j.defects?.map((d: any) =>
                  d.status === 'OPEN' ? { ...d, status: 'IN_REPAIR' } : d
                ) || [],
              }
            : j
        )
      );

      setIsModalOpen(false);
      setSelectedJob(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ไม่สามารถบันทึกข้อมูลการส่งซ่อมได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRepair = (job: any) => {
    setConfirmJob(job);
    setIsConfirmOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!confirmJob) return;
    setConfirmSubmitting(true);

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: confirmJob.id,
            status: 'APPROVED',
            repairCompleted: true,
            approverId: session?.user?.id || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to complete repair');
        }
        
        toast.success('บันทึกซ่อมเสร็จสิ้น', { description: 'นำรถเข้าสต็อกเรียบร้อยแล้ว' });
      } else {
        toast.success('บันทึกซ่อมเสร็จสิ้น', { description: '[Mock Mode] นำรถเข้าสต็อกเรียบร้อยแล้ว' });
      }

      // Remove the job from the local list
      setJobs((prevJobs) => prevJobs.filter((j) => j.id !== confirmJob.id));
      router.refresh();
      setIsConfirmOpen(false);
      setConfirmJob(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">รายการส่งซ่อม/ปรับสภาพ (Pending Repairs)</h2>
          <p className="text-xs text-slate-500 mt-1">
            รายการรถยนต์ที่ตรวจพบจุดชำรุด หรือถูกตีกลับ (Reject) เพื่อดำเนินการแก้ไขปรับสภาพโดยผู้ดูแลระบบ (Supervisor)
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

      {/* Repairs Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-teal" />
            <span>รายการที่อยู่ระหว่างการปรับสภาพ ({filteredJobs.length} งาน)</span>
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
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">จุดบกพร่อง<br/><span className="text-[10px] text-slate-400 font-normal">(Defects)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ข้อมูลส่งซ่อม<br/><span className="text-[10px] text-slate-400 font-normal">(Repair Info)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">อัปเดตล่าสุด<br/><span className="text-[10px] text-slate-400 font-normal">(Last Updated)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">สถานะ<br/><span className="text-[10px] text-slate-400 font-normal">(Status)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">จัดการ<br/><span className="text-[10px] text-slate-400 font-normal">(Action)</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                      ไม่มีงานที่ตรวจพบจุดชำรุดค้างซ่อมในขณะนี้
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
                      <TableCell className="text-center py-4">
                        <span className="inline-flex items-center justify-center font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs min-w-6">
                          {job.defects?.length || 0}
                        </span>
                      </TableCell>
                      
                      {/* Repair Info Column */}
                      <TableCell className="text-xs py-4">
                        {job.sentToRepairAt ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(job.sentToRepairAt).toLocaleDateString('th-TH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 max-w-[160px] truncate" title={job.repairLocation}>
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {job.repairLocation}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 italic">ยังไม่ส่งซ่อม</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs font-mono text-slate-500 py-4">
                        {job.updatedAt 
                          ? new Date(job.updatedAt).toLocaleString('th-TH') 
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {job.sentToRepairAt ? (
                          <Badge className="text-[10px] font-semibold px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 whitespace-nowrap">
                            กำลังปรับสภาพ/ซ่อม
                          </Badge>
                        ) : job.status === 'DEFECT_FOUND' ? (
                          <Badge className="text-[10px] font-semibold px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 whitespace-nowrap">
                            พบจุดชำรุด (รอส่งซ่อม)
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] font-semibold px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 whitespace-nowrap">
                            ถูก Reject (รอส่งซ่อม)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center gap-2">
                          {job.sentToRepairAt ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-[11px] font-semibold border-amber-200 text-amber-700 bg-amber-50/10 hover:bg-amber-50 hover:text-amber-800 whitespace-nowrap transition-colors"
                                onClick={() => handleOpenRepairModal(job)}
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>แก้ไขข้อมูลซ่อม</span>
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shadow-sm hover:shadow transition-all"
                                onClick={() => handleCompleteRepair(job)}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>ซ่อมเสร็จแล้ว</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-[11px] font-semibold border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white whitespace-nowrap transition-all"
                              onClick={() => handleOpenRepairModal(job)}
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>ส่งซ่อม</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Send to Repair Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 rounded-xl shadow-xl">
          <form onSubmit={handleSubmitRepair} className="space-y-4">
            <DialogHeader className="border-b pb-3 mb-2">
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-teal" />
                <span>{selectedJob?.sentToRepairAt ? 'แก้ไขรายละเอียดส่งซ่อม/ปรับสภาพ' : 'ดำเนินการนำรถส่งซ่อม/ปรับสภาพ'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                เลขที่งาน: <span className="font-mono font-semibold text-slate-700">{selectedJob?.jobNumber}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Vehicle Info Summary */}
            {selectedJob && (
              <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium">รุ่นรถ (Model):</span>
                  <span className="font-semibold text-slate-800">{selectedJob.vehicle?.modelName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">เลขตัวถัง (VIN):</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedJob.vehicleVin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">สีรถ (Color):</span>
                  <span className="font-semibold text-slate-800">{selectedJob.vehicle?.colorName || '-'}</span>
                </div>
              </div>
            )}

            {/* Defects Checklist Summary */}
            {selectedJob && selectedJob.defects && selectedJob.defects.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  จุดบกพร่องที่ต้องซ่อมแซม ({selectedJob.defects.length} จุด)
                </Label>
                <div className="max-h-24 overflow-y-auto border border-slate-100 rounded-lg p-2.5 bg-slate-50/40 space-y-1.5 text-xs">
                  {selectedJob.defects.map((defect: any, idx: number) => (
                    <div key={defect.id || idx} className="flex gap-2 text-slate-600 items-start">
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
                        {defect.defectNo || (idx + 1)}
                      </span>
                      <span className="leading-tight">{defect.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5 pt-1">
              {/* Repair Date */}
              <div className="space-y-1">
                <Label htmlFor="repair-date" className="text-xs font-semibold text-slate-700">
                  วันที่และเวลาส่งซ่อม
                </Label>
                <Input
                  id="repair-date"
                  type="datetime-local"
                  required
                  value={repairDate}
                  onChange={(e) => setRepairDate(e.target.value)}
                  className="text-xs h-9 border-slate-200 focus:border-brand-teal focus:ring-brand-teal"
                />
              </div>

              {/* Repair Location */}
              <div className="space-y-1">
                <Label htmlFor="repair-location" className="text-xs font-semibold text-slate-700">
                  สถานที่ส่งซ่อม / อู่ที่รับผิดชอบ
                </Label>
                <Select
                  id="repair-location"
                  value={repairLocation}
                  onChange={(e) => setRepairLocation(e.target.value)}
                  className="text-xs h-9 border-slate-200"
                >
                  <option value="อู่ตัวถังและสี (Body & Paint)">อู่ตัวถังและสี (Body & Paint)</option>
                  <option value="ฝ่ายเทคนิค/ช่างเครื่องยนต์ (Mechanic/Technical)">ฝ่ายเทคนิค/ช่างเครื่องยนต์ (Mechanic/Technical)</option>
                  <option value="อู่ภายนอก (External Shop)">อู่ภายนอก (External Shop)</option>
                  <option value="อื่น ๆ">อื่น ๆ (ระบุเอง)</option>
                </Select>
              </div>

              {/* Custom Location (conditional) */}
              {repairLocation === 'อื่น ๆ' && (
                <div className="space-y-1 animate-in fade-in-50 duration-200">
                  <Label htmlFor="custom-location" className="text-xs font-semibold text-slate-700">
                    ระบุสถานที่ส่งซ่อม
                  </Label>
                  <Input
                    id="custom-location"
                    required
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="กรอกชื่ออู่ หรือ แผนก..."
                    className="text-xs h-9 border-slate-200 focus:border-brand-teal focus:ring-brand-teal"
                  />
                </div>
              )}

              {/* Repair Notes */}
              <div className="space-y-1">
                <Label htmlFor="repair-notes" className="text-xs font-semibold text-slate-700">
                  หมายเหตุ / คำสั่งซ่อมเพิ่มเติม (ถ้ามี)
                </Label>
                <textarea
                  id="repair-notes"
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="เช่น ขัดลบรอยขีดข่วน หรือ ตรวจเช็คกลไกเป็นพิเศษ..."
                  className="w-full text-xs min-h-[70px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t flex sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold"
                disabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-9 px-4 text-xs font-semibold bg-brand-teal hover:bg-brand-teal/90 text-white"
                disabled={submitting}
              >
                {submitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Repair Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 rounded-xl shadow-xl">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <CheckCircle className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-800">
              ยืนยันการซ่อมแซมเสร็จสิ้น
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 max-w-sm">
              คุณต้องการยืนยันว่าการซ่อมแซมสำหรับงานเลขที่{' '}
              <span className="font-mono font-bold text-slate-700">{confirmJob?.jobNumber}</span>{' '}
              เสร็จสิ้นแล้วใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-700">คำเตือน / ข้อมูลสำคัญ:</p>
              <p className="mt-0.5">การยืนยันจะเปลี่ยนสถานะจุดบกพร่องทั้งหมดของงานนี้เป็น <span className="font-semibold text-emerald-600">แก้ไขแล้ว</span> และนำรถกลับเข้าสู่สถานะ <span className="font-semibold text-blue-600">In Stock</span> ทันที</p>
            </div>
          </div>

          <div className="mt-4 border-t pt-3 flex justify-center items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsConfirmOpen(false);
                setConfirmJob(null);
              }}
              className="h-9 px-4 text-xs font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={confirmSubmitting}
            >
              ยกเลิก (Cancel)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmJob ? handleConfirmComplete : undefined}
              className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              disabled={confirmSubmitting}
            >
              {confirmSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการซ่อมเสร็จ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
