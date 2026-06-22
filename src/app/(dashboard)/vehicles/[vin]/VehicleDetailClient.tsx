'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, UserCheck, Shield, Clipboard, MapPin, BarChart2, Car } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime, formatLocalDate, getPdiRouteSlug } from '@/lib/utils';

interface VehicleDetailClientProps {
  initialVehicle: any;
  vin: string;
  isDbConnected: boolean;
}

export default function VehicleDetailClient({ initialVehicle, vin, isDbConnected }: VehicleDetailClientProps) {
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
        }
  );

  // Manual Trigger Modals States
  const [isLtmOpen, setIsLtmOpen] = useState(false);
  const [ltmInterval, setLtmInterval] = useState('30');
  const [ltmScheduledDate, setLtmScheduledDate] = useState('');

  const [isPdOpen, setIsPdOpen] = useState(false);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [salesName, setSalesName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [loading, setLoading] = useState(false);

  // Manual Long-term Job Submit
  const handleTriggerLtm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ltmScheduledDate) {
      alert('กรุณาระบุวันที่กำหนดตรวจ');
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
        setVehicle({
          ...vehicle,
          pdiJobs: [newJob, ...vehicle.pdiJobs],
        });
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

      alert(`สร้างงานตรวจบำรุงรักษาระยะยาว ${ltmInterval} วัน เรียบร้อยแล้ว`);
      setIsLtmOpen(false);
      setLtmScheduledDate('');
    } catch (err: any) {
      console.error(err);
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual Pre-delivery Job Submit
  const handleTriggerPd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeliveryDate || !salesName || !customerName || !customerPhone) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนเพื่อรองรับการตรวจก่อนส่งมอบและ PDPA');
      return;
    }

    setLoading(true);
    const payload = {
      pdiType: 'PRE_DELIVERY',
      vehicleVin: vin,
      targetDeliveryDate: new Date(targetDeliveryDate).toISOString(),
      salesName,
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
        setVehicle({
          ...vehicle,
          pdiJobs: [newJob, ...vehicle.pdiJobs],
        });
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

      alert('สร้างงานตรวจสภาพเตรียมส่งมอบลูกค้า (Pre-delivery PDI) เรียบร้อยแล้ว');
      setIsPdOpen(false);
      setTargetDeliveryDate('');
      setSalesName('');
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: any) {
      console.error(err);
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
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
            <CardHeader className="flex flex-row items-center gap-3 border-b border-card-border/50">
              <div className="w-10 h-10 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{vehicle.modelName}</CardTitle>
                <Badge variant={vehicle.currentStatus === 'IN_STOCK' ? 'info' : 'success'} className="mt-1">
                  {vehicle.currentStatus === 'IN_STOCK' ? 'ใน Stock' : 'ส่งมอบแล้ว'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <p className="text-slate-500">เลขตัวถัง (VIN)</p>
                <p className="text-slate-800 font-mono text-sm select-all">{vehicle.vin}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
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
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
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

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
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
        </div>

        {/* Right Action & PDI history Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick manual triggers block */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-wrap gap-3">
            <Dialog open={isLtmOpen} onOpenChange={setIsLtmOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-semibold">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>สร้างใบงาน Long-term Maintenance</span>
                </Button>
              </DialogTrigger>
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
              <DialogTrigger asChild>
                <Button variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                  <UserCheck className="w-4 h-4 text-slate-950" />
                  <span>สร้างใบงาน Pre-delivery PDI (ส่งมอบ)</span>
                </Button>
              </DialogTrigger>
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
                    <div className="grid grid-cols-2 gap-3">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขสั่งงาน (Job No.)</TableHead>
                    <TableHead>ประเภท (PDI Type)</TableHead>
                    <TableHead>สถานะ (Status)</TableHead>
                    <TableHead>ช่างตรวจ (Inspector)</TableHead>
                    <TableHead>วันที่สั่งสร้าง (Created)</TableHead>
                    <TableHead className="text-right">เข้าดำเนินการ</TableHead>
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
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs text-slate-800 select-all">{job.jobNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {job.pdiType}
                            {job.ltmInterval ? ` (${job.ltmInterval}วัน)` : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.status === 'PENDING' && <Badge variant="default">รอตรวจ</Badge>}
                          {job.status === 'IN_PROGRESS' && <Badge variant="info">กำลังตรวจ</Badge>}
                          {job.status === 'PENDING_APPROVAL' && <Badge variant="warning">รอ QC</Badge>}
                          {job.status === 'APPROVED' && <Badge variant="success">ผ่านตรวจ</Badge>}
                          {job.status === 'REJECTED' && <Badge variant="danger">ถูก Reject</Badge>}
                        </TableCell>
                        <TableCell className="text-xs">{job.inspector?.name || '-'}</TableCell>
                        <TableCell className="text-xs">{new Date(job.createdAt).toLocaleDateString('th-TH')}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/pdi/${getPdiRouteSlug(job.pdiType)}/${job.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5">
                              {job.status === 'APPROVED' ? 'ดูรายละเอียด' : 'ตรวจรถ'}
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
      </div>
    </div>
  );
}
