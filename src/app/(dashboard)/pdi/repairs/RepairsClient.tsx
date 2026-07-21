'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wrench, Search, ShieldAlert, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getPdiRouteSlug } from '@/lib/utils';

// Import refactored modules
import { useRepairs } from './hooks/useRepairs';
import { SendRepairDialog } from './components/SendRepairDialog';
import { ConfirmCompleteDialog } from './components/ConfirmCompleteDialog';

interface RepairsClientProps {
  initialJobs: any[];
  isDbConnected: boolean;
  branches?: any[];
}

export default function RepairsClient({ initialJobs, isDbConnected, branches = [] }: RepairsClientProps) {
  const { data: session } = useSession();

  const dbBranches = branches && branches.length > 0 ? branches : [
    { id: '1', code: 'MBR', name: 'Aion มีนบุรี' },
    { id: '2', code: 'KJN', name: 'Aion กาญจนาภิเษก' },
    { id: '3', code: 'LBD', name: 'Aion ลาดบังดี' },
    { id: '4', code: 'PBL', name: 'Aion พิบูลสงคราม' },
    { id: '5', code: 'MHC', name: 'Aion มหาชัย' },
    { id: '6', code: 'SLY', name: 'Aion สุราษฎร์ธานี' },
    { id: '7', code: 'AYT', name: 'Aion อยุธยา' },
  ];

  // Destructure hook state and handlers
  const {
    searchTerm,
    setSearchTerm,
    filteredJobs,
    selectedJob,
    isModalOpen,
    setIsModalOpen,
    repairDate,
    setRepairDate,
    repairLocation,
    setRepairLocation,
    customLocation,
    setCustomLocation,
    repairNotes,
    setRepairNotes,
    submitting,
    confirmJob,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmSubmitting,
    repairPhotos,
    photoUploading,
    handleOpenRepairModal,
    handleSubmitRepair,
    handlePrint,
    handleCompleteRepair,
    handleRepairPhotoUpload,
    handleRemoveRepairPhoto,
    handleConfirmComplete,
  } = useRepairs({ initialJobs, isDbConnected, dbBranches, session });

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

  return (
    <>
      <div className="space-y-6 print-hidden">
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
                    <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ประเภท<br/><span className="text-[10px] text-slate-400 font-normal">(Type)</span></TableHead>
                    <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">รุ่นรถ<br/><span className="text-[10px] text-slate-400 font-normal">(Model)</span></TableHead>
                    <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">เลขตัวถัง<br/><span className="text-[10px] text-slate-400 font-normal">(VIN)</span></TableHead>
                    <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">สาขา<br/><span className="text-[10px] text-slate-400 font-normal">(Branch)</span></TableHead>
                    <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ช่างตรวจ<br/><span className="text-[10px] text-slate-400 font-normal">(Inspector)</span></TableHead>
                    <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">จุดบกพร่อง<br/><span className="text-[10px] text-slate-400 font-normal">(Defects)</span></TableHead>
                    <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">จัดการ<br/><span className="text-[10px] text-slate-400 font-normal">(Action)</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                        ไม่มีงานที่ตรวจพบจุดชำรุดค้างซ่อมในขณะนี้
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 font-mono text-xs font-semibold text-slate-800">
                          {job.jobNumber}
                        </TableCell>
                        <TableCell className="py-4">
                          {getPdiTypeBadge(job.pdiType)}
                        </TableCell>
                        <TableCell className="py-4 text-xs font-bold text-slate-800">
                          {job.vehicle?.modelName || 'ไม่พบรุ่นรถ'}
                        </TableCell>
                        <TableCell className="py-4 font-mono text-[10px] text-slate-500 font-semibold select-all">
                          {job.vehicleVin}
                        </TableCell>
                        <TableCell className="text-xs py-4 text-slate-700 font-medium">
                          {job.vehicle?.branch?.name || '-'}
                        </TableCell>
                        <TableCell className="text-xs py-4 text-slate-650 font-medium">
                          {job.inspector?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs min-w-6">
                            {job.defects?.length || 0}
                          </span>
                        </TableCell>

                        <TableCell className="text-center py-4">
                          <div className="flex justify-center items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="พิมพ์ใบสั่งซ่อม"
                              className="h-8 w-8 p-0 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                              onClick={() => handlePrint(job)}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            {job.sentToRepairAt ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1.5 text-[11px] font-semibold border-orange-200 text-orange-700 bg-orange-50/10 hover:bg-orange-50 hover:text-orange-800 whitespace-nowrap transition-colors"
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
      </div>

      {/* 2. Dialog Component สำหรับบันทึกการส่งซ่อม */}
      <SendRepairDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmitRepair}
        selectedJob={selectedJob}
        repairDate={repairDate}
        setRepairDate={setRepairDate}
        repairLocation={repairLocation}
        setRepairLocation={setRepairLocation}
        customLocation={customLocation}
        setCustomLocation={setCustomLocation}
        repairNotes={repairNotes}
        setRepairNotes={setRepairNotes}
        submitting={submitting}
        dbBranches={dbBranches}
      />

      {/* 3. Dialog Component สำหรับยืนยันการอนุมัติซ่อมเสร็จสิ้น */}
      <ConfirmCompleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        confirmJob={confirmJob}
        repairPhotos={repairPhotos}
        photoUploading={photoUploading}
        onPhotoUpload={handleRepairPhotoUpload}
        onRemovePhoto={handleRemoveRepairPhoto}
        onConfirm={handleConfirmComplete}
        confirmSubmitting={confirmSubmitting}
      />
    </>
  );
}
