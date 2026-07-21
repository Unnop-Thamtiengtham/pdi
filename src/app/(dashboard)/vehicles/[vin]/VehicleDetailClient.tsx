'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Calendar, UserCheck, Shield, Clipboard, Car, Edit, Clock, Wrench, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime, formatLocalDate, getPdiRouteSlug } from '@/lib/utils';
import { MODEL_NAMES } from '@/types/pdi';

// Import refactored modules
import { useVehicleDetail } from './hooks/useVehicleDetail';
import { EditVehicleDialog } from './components/EditVehicleDialog';
import { LtmTriggerDialog } from './components/LtmTriggerDialog';
import { PdTriggerDialog } from './components/PdTriggerDialog';
import { ImageLightbox } from './components/ImageLightbox';

interface VehicleDetailClientProps {
  initialVehicle: any;
  vin: string;
  isDbConnected: boolean;
  branches: any[];
}

export default function VehicleDetailClient({ initialVehicle, vin, isDbConnected, branches }: VehicleDetailClientProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'INSPECTOR';
  const canCreateJobs = userRole !== 'INSPECTOR';

  const dbBranches = branches && branches.length > 0 ? branches : [{ id: 'mock-branch', code: 'MBR', name: 'มีนบุรี' }];

  // Destructure state and actions from Hook
  const {
    vehicle,
    loading,
    isLtmOpen,
    setIsLtmOpen,
    ltmInterval,
    setLtmInterval,
    ltmScheduledDate,
    setLtmScheduledDate,
    isPdOpen,
    setIsPdOpen,
    targetDeliveryDate,
    setTargetDeliveryDate,
    salesName,
    setSalesName,
    salesPhone,
    setSalesPhone,
    salesBranch,
    setSalesBranch,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    isEditOpen,
    setIsEditOpen,
    editVin,
    setEditVin,
    editModelCode,
    setEditModelCode,
    editColorName,
    setEditColorName,
    editExteriorColor,
    setEditExteriorColor,
    editInteriorColor,
    setEditInteriorColor,
    editProductionYear,
    setEditProductionYear,
    editWsDate,
    setEditWsDate,
    editMotorBatteryNumber,
    setEditMotorBatteryNumber,
    editWarehouse,
    setEditWarehouse,
    editFloorplan,
    setEditFloorplan,
    editBranchId,
    setEditBranchId,
    editLoading,
    previewImageUrl,
    setPreviewImageUrl,
    handleTriggerLtm,
    handleTriggerPd,
    handleEditVehicle,
  } = useVehicleDetail({ initialVehicle, vin, isDbConnected, dbBranches: branches });

  const hasPassedIncoming = (vehicle.pdiJobs || []).some(
    (j: any) => j.pdiType === 'INCOMING' && j.status === 'APPROVED'
  );

  return (
    <div className="space-y-6">
      {/* Page header navigation */}
      <div className="flex items-center gap-3">
        <Link href="/vehicles">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Button>
        </Link>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Vehicle Detail Profile</span>
          <h2 className="text-lg font-bold text-slate-800 tracking-wide flex items-center gap-2">
            ข้อมูลเลขตัวถัง: {vehicle.vin}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Specification Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-card-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{vehicle.modelName}</CardTitle>
                  <Badge variant={vehicle.currentStatus === 'IN_STOCK' ? 'info' : 'success'} className="mt-1">
                    {vehicle.currentStatus === 'IN_STOCK' ? 'ใน Stock' : 'ส่งมอบแล้ว'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[11px] h-7 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>แก้ไข</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">เลขตัวถัง (VIN)</p>
                <p className="text-slate-800 font-mono text-sm select-all">{vehicle.vin}</p>
              </div>

              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">เลขมอเตอร์แบตเตอรี่ (Motor Battery No.)</p>
                <p className="text-slate-800 font-mono font-medium select-all">{vehicle.motorBatteryNumber || '-'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500">สีรถภายนอกหลัก</p>
                  <p className="text-slate-800 font-medium">{vehicle.colorName || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">ปีที่ผลิตรถ</p>
                  <p className="text-slate-800 font-mono">{vehicle.productionYear || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500">ลักษณะสีภายนอก</p>
                  <p className="text-slate-800 font-medium">{vehicle.exteriorColor || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">โทนตกแต่งภายใน</p>
                  <p className="text-slate-800 font-medium">{vehicle.interiorColor || '-'}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">วันที่ขายส่งดีลเลอร์ (WSDate)</p>
                <p className="text-slate-800 font-medium">{formatLocalDate(vehicle.wsDate)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500">คลังสินค้าโกดัง</p>
                  <p className="text-slate-800 font-semibold">{vehicle.warehouse || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">ตำแหน่ง/โซนจอด</p>
                  <p className="text-slate-800 font-semibold">{vehicle.floorplan || '-'}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">สาขาที่จัดสรรสต็อก (Allocated Branch)</p>
                <p className="text-slate-800 font-semibold">{vehicle.branch?.name || '-'}</p>
              </div>

              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">วันที่เรือลงเทียบฝั่ง (Arrived)</p>
                <p className="text-slate-800 font-medium">{formatDateTime(vehicle.arrivedAt)}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-slate-500">กำหนดเคลมความผิดปกติ (Incoming SLA 24h)</p>
                <p className="text-slate-800 font-medium text-error font-mono">{formatDateTime(vehicle.incomingDeadline)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Edit History Timeline Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b border-card-border/50 py-3.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-xs font-bold text-slate-800">
                ประวัติการแก้ไขรายละเอียดรถ ({vehicle.editLogs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
              {!vehicle.editLogs || vehicle.editLogs.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">ไม่มีประวัติการแก้ไขข้อมูล</p>
              ) : (
                <div className="relative pl-4 border-l border-slate-100 space-y-4">
                  {vehicle.editLogs.map((log: any) => (
                    <div key={log.id} className="relative text-[11px] space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21.5px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border border-white" />
                      
                      <div className="flex justify-between text-slate-400 font-semibold text-[10px] gap-2">
                        <span>โดย: {log.editedBy}</span>
                        <span>{new Date(log.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed select-all">{log.changeDetails}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Action & PDI history Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick manual triggers block */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3">
            {canCreateJobs ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!hasPassedIncoming}
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                  onClick={() => setIsLtmOpen(true)}
                >
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>สร้างใบงาน Long-term Maintenance</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!hasPassedIncoming}
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                  onClick={() => setIsPdOpen(true)}
                >
                  <UserCheck className="w-4 h-4 text-slate-950" />
                  <span>สร้างใบงาน Pre-delivery PDI (ส่งมอบ)</span>
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-550 flex items-center gap-1.5 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-slate-500">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>เฉพาะสิทธิ์ผู้ดูแลระบบ หรือ QC/Supervisor เท่านั้นที่มีสิทธิ์เปิดงานตรวจ Long-term และ Pre-delivery PDI ได้</span>
              </p>
            )}

            {!hasPassedIncoming && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1.5 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span>รถคันนี้ยังไม่ผ่านการตรวจแรกรับ (Incoming ) คุณจะไม่สามารถเปิดใบสั่งงานตรวจประเภทอื่นได้จนกว่าผลการตรวจแรกรับจะได้รับการอนุมัติ (APPROVED)</span>
              </p>
            )}
          </div>

          {/* Timeline of PDI jobs */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Clipboard className="w-4 h-4 text-brand-teal" />
                <span>ประวัติรายการงานตรวจ PDI สำหรับคันนี้</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                    <TableRow>
                      <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">เลขสั่งงาน<br/><span className="text-[10px] text-slate-400 font-normal">(Job No.)</span></TableHead>
                      <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ประเภท<br/><span className="text-[10px] text-slate-400 font-normal">(PDI Type)</span></TableHead>
                      <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">สถานะ<br/><span className="text-[10px] text-slate-400 font-normal">(Status)</span></TableHead>
                      <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ช่างตรวจ<br/><span className="text-[10px] text-slate-400 font-normal">(Inspector)</span></TableHead>
                      <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">วันที่สั่งสร้าง<br/><span className="text-[10px] text-slate-400 font-normal">(Created At)</span></TableHead>
                      <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">เข้าดำเนินการ<br/><span className="text-[10px] text-slate-400 font-normal">(Action)</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.pdiJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                          ยังไม่มีประวัติการเปิดงาน PDI
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicle.pdiJobs.map((job: any) => (
                        <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono text-xs text-slate-800 select-all py-4">{job.jobNumber}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-xs w-fit">
                                {job.pdiType}
                                {job.ltmInterval ? ` (${job.ltmInterval}วัน)` : ''}
                              </Badge>
                              {job.notes && (
                                <span className={`text-[10px] leading-tight ${job.notes.includes('[SYSTEM]') ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                                  {job.notes.replace('[SYSTEM] อนุมัติแรกรับอัตโนมัติ (ขายด่วน / สร้างใบงานส่งมอบทันที)', '[SYSTEM] อนุมัติอัตโนมัติ (ขายด่วน)')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap py-4">
                            {job.status === 'PENDING' && <Badge variant="default">รอตรวจ</Badge>}
                            {job.status === 'IN_PROGRESS' && <Badge variant="info">กำลังตรวจ</Badge>}
                            {job.status === 'DEFECT_FOUND' && <Badge variant="danger">พบจุดชำรุด</Badge>}
                            {job.status === 'PENDING_APPROVAL' && <Badge variant="warning">รอ QC</Badge>}
                            {job.status === 'APPROVED' && <Badge variant="success">ผ่านตรวจ</Badge>}
                            {job.status === 'REJECTED' && <Badge variant="danger">ถูก Reject</Badge>}
                          </TableCell>
                          <TableCell className="text-xs py-4">{job.inspector?.name || '-'}</TableCell>
                          <TableCell className="text-xs py-4">{new Date(job.createdAt).toLocaleDateString('th-TH')}</TableCell>
                          <TableCell className="text-center whitespace-nowrap py-4">
                            <Link href={`/pdi/${getPdiRouteSlug(job.pdiType)}/${job.id}`}>
                              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5 whitespace-nowrap cursor-pointer">
                                {job.status === 'APPROVED' ? 'ดูรายละเอียด' : 'ตรวจรถ'}
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

          {/* Repair History with Photos */}
          {vehicle.defects && vehicle.defects.length > 0 && (
            <Card>
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>ประวัติการซ่อม / จุดบกพร่อง ({vehicle.defects.length} จุด)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicle.defects.map((defect: any) => {
                  const job = vehicle.pdiJobs?.find((j: any) => j.id === defect.jobId);
                  const hasBeforePhotos = defect.photoUrls && defect.photoUrls.length > 0;
                  const hasAfterPhotos = defect.repairPhotoUrls && defect.repairPhotoUrls.length > 0;

                  return (
                    <div
                      key={defect.id}
                      className={`border rounded-lg p-3 text-xs space-y-2.5 ${
                        defect.status === 'RESOLVED' || defect.status === 'CLOSED'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : defect.status === 'IN_REPAIR'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-red-200 bg-red-50/20'
                      }`}
                    >
                      {/* Defect header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {defect.defectNo}
                          </span>
                          <div className="min-w-0">
                            <p className="text-slate-800 font-medium leading-tight">{defect.description}</p>
                            {job && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                งาน: <span className="font-mono font-medium text-slate-500">{job.jobNumber}</span>
                                {' · '}
                                {job.pdiType}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {defect.severity === 'CRITICAL' && (
                            <Badge variant="danger" className="text-[9px]">วิกฤต</Badge>
                          )}
                          {(defect.status === 'RESOLVED' || defect.status === 'CLOSED') && (
                            <Badge variant="success" className="text-[9px] flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              ซ่อมแล้ว
                            </Badge>
                          )}
                          {defect.status === 'IN_REPAIR' && (
                            <Badge variant="warning" className="text-[9px]">กำลังซ่อม</Badge>
                          )}
                          {defect.status === 'OPEN' && (
                            <Badge variant="danger" className="text-[9px]">รอแก้ไข</Badge>
                          )}
                        </div>
                      </div>

                      {/* Photos comparison — column layout */}
                      {(hasBeforePhotos || hasAfterPhotos) && (
                        <div className="space-y-2.5 pt-1">
                          {/* Before photos */}
                          {hasBeforePhotos && (
                            <div className="space-y-1.5 bg-red-50/40 rounded-lg p-2.5 border border-red-100">
                              <p className="text-[10px] font-semibold text-red-600 flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                รูปก่อนซ่อม ({defect.photoUrls.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {defect.photoUrls.map((url: string, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPreviewImageUrl(url)}
                                    className="block w-20 h-20 rounded-lg overflow-hidden border-2 border-red-200 shadow-sm hover:shadow-md hover:border-red-400 transition-all cursor-pointer"
                                  >
                                    <img src={url} alt={`ก่อนซ่อม ${idx + 1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Arrow separator */}
                          {hasBeforePhotos && hasAfterPhotos && (
                            <div className="flex items-center justify-center">
                              <span className="text-slate-300 text-lg">▼</span>
                            </div>
                          )}

                          {/* After photos */}
                          {hasAfterPhotos && (
                            <div className="space-y-1.5 bg-emerald-50/40 rounded-lg p-2.5 border border-emerald-100">
                              <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                รูปหลังซ่อม ({defect.repairPhotoUrls.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {defect.repairPhotoUrls.map((url: string, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPreviewImageUrl(url)}
                                    className="block w-20 h-20 rounded-lg overflow-hidden border-2 border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer"
                                  >
                                    <img src={url} alt={`หลังซ่อม ${idx + 1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resolved timestamp */}
                      {defect.resolvedAt && (
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          ซ่อมเสร็จเมื่อ: {new Date(defect.resolvedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Vehicle Details Dialog */}
      <EditVehicleDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleEditVehicle}
        vin={vin}
        editVin={editVin}
        setEditVin={setEditVin}
        editModelCode={editModelCode}
        setEditModelCode={setEditModelCode}
        editColorName={editColorName}
        setEditColorName={setEditColorName}
        editExteriorColor={editExteriorColor}
        setEditExteriorColor={setEditExteriorColor}
        editInteriorColor={editInteriorColor}
        setEditInteriorColor={setEditInteriorColor}
        editProductionYear={editProductionYear}
        setEditProductionYear={setEditProductionYear}
        editWsDate={editWsDate}
        setEditWsDate={setEditWsDate}
        editMotorBatteryNumber={editMotorBatteryNumber}
        setEditMotorBatteryNumber={setEditMotorBatteryNumber}
        editWarehouse={editWarehouse}
        setEditWarehouse={setEditWarehouse}
        editFloorplan={editFloorplan}
        setEditFloorplan={setEditFloorplan}
        editBranchId={editBranchId}
        setEditBranchId={setEditBranchId}
        dbBranches={dbBranches}
        editLoading={editLoading}
      />

      {/* Manual LTM Trigger Dialog */}
      <LtmTriggerDialog
        open={isLtmOpen}
        onOpenChange={setIsLtmOpen}
        onSubmit={handleTriggerLtm}
        ltmInterval={ltmInterval}
        setLtmInterval={setLtmInterval}
        ltmScheduledDate={ltmScheduledDate}
        setLtmScheduledDate={setLtmScheduledDate}
        loading={loading}
      />

      {/* Manual PD Trigger Dialog */}
      <PdTriggerDialog
        open={isPdOpen}
        onOpenChange={setIsPdOpen}
        onSubmit={handleTriggerPd}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        salesName={salesName}
        setSalesName={setSalesName}
        salesPhone={salesPhone}
        setSalesPhone={setSalesPhone}
        salesBranch={salesBranch}
        setSalesBranch={setSalesBranch}
        targetDeliveryDate={targetDeliveryDate}
        setTargetDeliveryDate={setTargetDeliveryDate}
        dbBranches={dbBranches}
        loading={loading}
      />

      {/* Fullscreen Image Preview Lightbox */}
      <ImageLightbox
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
}
