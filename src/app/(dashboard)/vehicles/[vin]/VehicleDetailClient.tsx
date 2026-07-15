'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, UserCheck, Shield, Clipboard, MapPin, BarChart2, Car, AlertTriangle, Edit, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDateTime, formatLocalDate, getPdiRouteSlug } from '@/lib/utils';
import { MODEL_NAMES, ModelCode } from '@/types/pdi';

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

  const [vehicle, setVehicle] = useState(
    isDbConnected
      ? initialVehicle
      : {
          vin,
          modelCode: 'AION_V',
          modelName: 'AION V',
          colorName: 'Space Gray',
          exteriorColor: 'Gray Metallic',
          interiorColor: 'Coal Black',
          productionYear: 2026,
          wsDate: '2026-05-10T00:00:00.000Z',
          currentStatus: 'IN_STOCK',
          warehouse: 'Main Dock',
          floorplan: 'Zone A',
          arrivedAt: '2026-06-08T12:00:00.000Z',
          incomingDeadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
          branch: { name: 'มีนบุรี' },
          pdiJobs: [
            {
              id: 'mock-1',
              jobNumber: 'JO-INC-20260609-001',
              pdiType: 'INCOMING',
              status: 'PENDING',
              createdAt: '2026-06-08T12:00:00.000Z',
              inspector: null,
              approver: null,
            },
          ],
          editLogs: [],
        }
  );

  const hasPassedIncoming = (vehicle.pdiJobs || []).some(
    (j: any) => j.pdiType === 'INCOMING' && j.status === 'APPROVED'
  );

  // Manual Trigger Modals States
  const [isLtmOpen, setIsLtmOpen] = useState(false);
  const [ltmInterval, setLtmInterval] = useState('30');
  const [ltmScheduledDate, setLtmScheduledDate] = useState('');

  const [isPdOpen, setIsPdOpen] = useState(false);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [salesName, setSalesName] = useState('');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesBranch, setSalesBranch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [loading, setLoading] = useState(false);

  // Edit Vehicle Details state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editVin, setEditVin] = useState(vehicle.vin);
  const [editModelCode, setEditModelCode] = useState(vehicle.modelCode || 'AION_V');
  const [editColorName, setEditColorName] = useState(vehicle.colorName || '');
  const [editExteriorColor, setEditExteriorColor] = useState(vehicle.exteriorColor || '');
  const [editInteriorColor, setEditInteriorColor] = useState(vehicle.interiorColor || '');
  const [editProductionYear, setEditProductionYear] = useState(String(vehicle.productionYear || 2026));
  const [editWsDate, setEditWsDate] = useState(vehicle.wsDate ? new Date(vehicle.wsDate).toISOString().slice(0, 10) : '');
  const [editMotorBatteryNumber, setEditMotorBatteryNumber] = useState(vehicle.motorBatteryNumber || '');
  const [editWarehouse, setEditWarehouse] = useState(vehicle.warehouse || '');
  const [editFloorplan, setEditFloorplan] = useState(vehicle.floorplan || '');
  const [editBranchId, setEditBranchId] = useState(vehicle.branchId || '');
  const [editLoading, setEditLoading] = useState(false);

  const dbBranches = branches && branches.length > 0 ? branches : [{ id: 'mock-branch', code: 'MBR', name: 'มีนบุรี' }];

  // Manual Long-term Job Submit
  const handleTriggerLtm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ltmScheduledDate) {
      toast.warning('กรุณาระบุวันที่กำหนดตรวจ');
      return;
    }

    setLoading(true);
    const payload = {
      pdiType: 'LONG_TERM',
      vehicleVin: vin,
      ltmInterval: parseInt(ltmInterval),
      scheduledDate: new Date(ltmScheduledDate).toISOString(),
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create job');
        }

        const newJob = await res.json();
        toast.success('สร้างงาน Long-term สำเร็จ', { description: `สร้างงานตรวจบำรุงรักษาระยะยาว ${ltmInterval} วัน เรียบร้อยแล้ว` });
        setIsLtmOpen(false);
        setLtmScheduledDate('');
        window.location.reload();
        return;
      } else {
        // Mock State Update
        const mockNewJob = {
          id: `mock-ltm-${Date.now()}`,
          jobNumber: `JO-LTM-20260609-${Math.floor(1000 + Math.random() * 9000)}`,
          pdiType: 'LONG_TERM',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          scheduledDate: payload.scheduledDate,
          ltmInterval: payload.ltmInterval,
          inspector: null,
          approver: null,
        };
        setVehicle({
          ...vehicle,
          pdiJobs: [mockNewJob, ...vehicle.pdiJobs],
        });
      }

      window.dispatchEvent(new Event('pdi-job-updated'));
      toast.success('สร้างงาน Long-term สำเร็จ', { description: `สร้างงานตรวจบำรุงรักษาระยะยาว ${ltmInterval} วัน เรียบร้อยแล้ว` });
      setIsLtmOpen(false);
      setLtmScheduledDate('');
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual Pre-delivery Job Submit
  const handleTriggerPd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeliveryDate || !salesName || !salesPhone || !salesBranch || !customerName || !customerPhone) {
      toast.warning('กรอกข้อมูลไม่ครบถ้วน', { description: 'กรุณากรอกรายละเอียดเพื่อรองรับการตรวจก่อนส่งมอบและ PDPA' });
      return;
    }

    setLoading(true);
    const payload = {
      pdiType: 'PRE_DELIVERY',
      vehicleVin: vin,
      targetDeliveryDate: new Date(targetDeliveryDate).toISOString(),
      salesName,
      salesPhone,
      salesBranch,
      customerName,
      customerPhone,
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create job');
        }

        const newJob = await res.json();
        toast.success('สร้างงาน Pre-delivery สำเร็จ', { description: 'สร้างงานตรวจเตรียมส่งมอบลูกค้าเรียบร้อยแล้ว' });
        setIsPdOpen(false);
        setTargetDeliveryDate('');
        setSalesName('');
        setSalesPhone('');
        setSalesBranch('');
        setCustomerName('');
        setCustomerPhone('');
        window.location.reload();
        return;
      } else {
        // Mock State Update
        const mockNewJob = {
          id: `mock-pd-${Date.now()}`,
          jobNumber: `JO-PD-20260609-${Math.floor(1000 + Math.random() * 9000)}`,
          pdiType: 'PRE_DELIVERY',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          targetDeliveryDate: payload.targetDeliveryDate,
          salesName: payload.salesName,
          salesPhone: payload.salesPhone,
          salesBranch: payload.salesBranch,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          inspector: null,
          approver: null,
        };
        setVehicle({
          ...vehicle,
          pdiJobs: [mockNewJob, ...vehicle.pdiJobs],
        });
      }

      window.dispatchEvent(new Event('pdi-job-updated'));
      toast.success('สร้างงาน Pre-delivery สำเร็จ', { description: 'สร้างงานตรวจเตรียมส่งมอบลูกค้าเรียบร้อยแล้ว' });
      setIsPdOpen(false);
      setTargetDeliveryDate('');
      setSalesName('');
      setSalesPhone('');
      setSalesBranch('');
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVin || editVin.trim().length < 5) {
      toast.warning('กรุณากรอกเลขตัวถัง (VIN) ที่ถูกต้อง');
      return;
    }
    if (!editColorName) {
      toast.warning('กรุณากรอกข้อมูลสำคัญ: สีหลัก');
      return;
    }

    setEditLoading(true);
    const payload = {
      vin: editVin.trim().toUpperCase(),
      modelCode: editModelCode,
      colorName: editColorName,
      exteriorColor: editExteriorColor,
      interiorColor: editInteriorColor,
      productionYear: parseInt(editProductionYear),
      wsDate: editWsDate ? new Date(editWsDate).toISOString() : null,
      motorBatteryNumber: editMotorBatteryNumber,
      warehouse: editWarehouse,
      floorplan: editFloorplan,
      branchId: editBranchId,
    };

    try {
      if (isDbConnected) {
        const res = await fetch(`/api/vehicles/${vin}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update vehicle details');
        }

        const updatedVeh = await res.json();
        setVehicle(updatedVeh);
      } else {
        // Mock State Update
        const mockChangeLog = {
          id: `mock-log-${Date.now()}`,
          vehicleVin: editVin.trim().toUpperCase(),
          editedBy: 'สมชาย ช่างตรวจ (Mock User)',
          changeDetails: editVin.trim().toUpperCase() !== vin.toUpperCase()
            ? `ปรับปรุงรายละเอียดรถยนต์แบบออฟไลน์ และเปลี่ยนเลขตัวถังจาก ${vin} เป็น ${editVin.trim().toUpperCase()}`
            : 'ปรับปรุงรายละเอียดรถยนต์แบบออฟไลน์ (Mock Mode)',
          createdAt: new Date().toISOString(),
        };
        const selectedBranch = dbBranches.find(b => b.id === editBranchId) || { name: 'มีนบุรี' };
        setVehicle({
          ...vehicle,
          vin: editVin.trim().toUpperCase(),
          modelCode: editModelCode,
          modelName: MODEL_NAMES[editModelCode as ModelCode] || editModelCode,
          colorName: editColorName,
          exteriorColor: editExteriorColor,
          interiorColor: editInteriorColor,
          productionYear: parseInt(editProductionYear),
          wsDate: editWsDate ? new Date(editWsDate).toISOString() : null,
          motorBatteryNumber: editMotorBatteryNumber,
          warehouse: editWarehouse,
          floorplan: editFloorplan,
          branchId: editBranchId,
          branch: { name: selectedBranch.name },
          editLogs: [mockChangeLog, ...(vehicle.editLogs || [])],
        });
      }

      window.dispatchEvent(new Event('pdi-job-updated'));
      
      if (editVin.trim().toUpperCase() !== vin.toUpperCase()) {
        toast.success('แก้ไขข้อมูลและเลขตัวถังสำเร็จ ระบบกำลังนำท่านไปยังหน้าใหม่');
        setTimeout(() => {
          window.location.href = `/vehicles/${editVin.trim().toUpperCase()}`;
        }, 1000);
      } else {
        toast.success('แก้ไขข้อมูลรถสำเร็จ');
        setIsEditOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

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
                className="gap-1 text-[11px] h-7 border-slate-200 text-slate-600 hover:bg-slate-50"
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

              {/* Added requested fields display */}
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

              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">สาขาที่จัดสรร (Branch)</p>
                <p className="text-slate-800 font-medium">{vehicle.branch?.name || '-'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500">คลังสินค้าโกดัง</p>
                  <p className="text-slate-800 font-medium">{vehicle.warehouse || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">โซน/ตำแหน่งจอด</p>
                  <p className="text-slate-800 font-medium">{vehicle.floorplan || '-'}</p>
                </div>
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
                  className="gap-1.5 text-xs font-semibold"
                  onClick={() => setIsLtmOpen(true)}
                >
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>สร้างใบงาน Long-term Maintenance</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!hasPassedIncoming}
                  className="gap-1.5 text-xs font-semibold"
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

            <Dialog open={isLtmOpen} onOpenChange={setIsLtmOpen}>
              <DialogContent className="max-w-md">
                <form onSubmit={handleTriggerLtm}>
                  <DialogHeader>
                    <DialogTitle>เปิดใบสั่งงานตรวจบำรุงรักษาระยะยาว</DialogTitle>
                    <DialogDescription>
                      ระบุรอบการตรวจและวันกำหนดตรวจเพื่อจัดสร้างใบสั่งงานสำหรับรถที่ค้าง Stock เกินเวลากำหนด
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">รอบการตรวจบำรุงรักษา (Interval)</Label>
                      <Select value={ltmInterval} onChange={(e: any) => setLtmInterval(e.target.value)}>
                        <option value="30">30 วัน (รอบแรก)</option>
                        <option value="60">60 วัน (รอบสอง)</option>
                        <option value="90">90 วัน (รอบสาม)</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">วันที่กำหนดให้ตรวจสภาพ</Label>
                      <Input
                        required
                        type="date"
                        value={ltmScheduledDate}
                        onChange={(e) => setLtmScheduledDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" size="sm">ยกเลิก</Button>
                    </DialogClose>
                    <Button type="submit" size="sm" disabled={loading}>
                      {loading ? 'กำลังเปิดงาน...' : 'ยืนยันสร้างใบงาน'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isPdOpen} onOpenChange={setIsPdOpen}>
              <DialogContent className="max-w-md">
                <form onSubmit={handleTriggerPd}>
                  <DialogHeader>
                    <DialogTitle>เปิดใบสั่งงานตรวจเตรียมส่งมอบลูกค้า (Pre-delivery PDI)</DialogTitle>
                    <DialogDescription>
                      กรอกรายละเอียดส่งมอบ ทะเบียนผู้ซื้อ และกำหนดวันส่งมอบรถเพื่อบันทึกเตรียมตรวจและรับความยินยอม PDPA
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4 text-xs">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">ชื่อลูกค้าผู้รับรถ *</Label>
                      <Input
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="เช่น นายสมบูรณ์ ดีงาม"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">เบอร์ติดต่อลูกค้า *</Label>
                      <Input
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="เช่น 089-123-4567"
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">ชื่อที่ปรึกษาการขาย (Sales) *</Label>
                        <Input
                          required
                          value={salesName}
                          onChange={(e) => setSalesName(e.target.value)}
                          placeholder="เช่น พลอยสวย รักขาย"
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">เบอร์โทรศัพท์ของ Sales *</Label>
                        <Input
                          required
                          value={salesPhone}
                          onChange={(e) => setSalesPhone(e.target.value)}
                          placeholder="เช่น 081-987-6543"
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">สาขาเจ้าของรถ (Branch) *</Label>
                        <Select value={salesBranch} onChange={(e: any) => setSalesBranch(e.target.value)} className="text-xs">
                          <option value="">เลือกสาขา</option>
                          {dbBranches.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">วันที่กำหนดส่งมอบลูกค้า *</Label>
                        <Input
                          required
                          type="date"
                          value={targetDeliveryDate}
                          onChange={(e) => setTargetDeliveryDate(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" size="sm">ยกเลิก</Button>
                    </DialogClose>
                    <Button type="submit" size="sm" disabled={loading}>
                      {loading ? 'กำลังเปิดงาน...' : 'ยืนยันสร้างใบงาน'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5 whitespace-nowrap">
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
        </div>
      {/* Edit Vehicle Details Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditVehicle}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-teal" />
                <span>แก้ไขรายละเอียดข้อมูลรถยนต์</span>
              </DialogTitle>
              <DialogDescription>
                ปรับเปลี่ยนข้อมูลคุณสมบัติ ข้อมูลขายส่ง หรือพิกัดจัดเก็บสินค้าของเลขตัวถัง {vin}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-slate-500 font-semibold">เลขตัวถัง (VIN) *</Label>
                <Input
                  required
                  value={editVin}
                  onChange={(e) => setEditVin(e.target.value)}
                  placeholder="กรอกเลขตัวถัง 17 หลัก"
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">รุ่นโมเดลรถ (Model) *</Label>
                <Select value={editModelCode} onChange={(e: any) => setEditModelCode(e.target.value)}>
                  {Object.entries(MODEL_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">สีรถภายนอกหลัก (Color Name) *</Label>
                <Input
                  required
                  value={editColorName}
                  onChange={(e) => setEditColorName(e.target.value)}
                  placeholder="เช่น Space Gray"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">ลักษณะสีภายนอก (Exterior Color)</Label>
                <Input
                  value={editExteriorColor}
                  onChange={(e) => setEditExteriorColor(e.target.value)}
                  placeholder="เช่น Gray Metallic"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">โทนตกแต่งภายใน (Interior Color)</Label>
                <Input
                  value={editInteriorColor}
                  onChange={(e) => setEditInteriorColor(e.target.value)}
                  placeholder="เช่น Coal Black"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">ปีที่ผลิตรถ (Production Year)</Label>
                <Select value={editProductionYear} onChange={(e: any) => setEditProductionYear(e.target.value)}>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">วันที่ขายส่งดีลเลอร์ (WSDate)</Label>
                <Input
                  type="date"
                  value={editWsDate}
                  onChange={(e) => setEditWsDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-slate-500">เลขมอเตอร์แบตเตอรี่ (Motor Battery No.)</Label>
                <Input
                  value={editMotorBatteryNumber}
                  onChange={(e) => setEditMotorBatteryNumber(e.target.value)}
                  placeholder="เช่น TZ220XS-BAT202606001"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">คลังสินค้าโกดัง (Warehouse)</Label>
                <Input
                  value={editWarehouse}
                  onChange={(e) => setEditWarehouse(e.target.value)}
                  placeholder="เช่น คลัง A"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">โซน/ตำแหน่งจอด (Floorplan)</Label>
                <Input
                  value={editFloorplan}
                  onChange={(e) => setEditFloorplan(e.target.value)}
                  placeholder="เช่น Zone 1"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-slate-500">สาขาที่จัดสรร (Branch)</Label>
                <Select value={editBranchId} onChange={(e: any) => setEditBranchId(e.target.value)}>
                  {dbBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" size="sm">
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={editLoading}>
                {editLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
