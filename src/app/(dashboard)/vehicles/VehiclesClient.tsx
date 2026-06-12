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
import { Plus, Car, Calendar, Sliders, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface VehiclesClientProps {
  initialVehicles: any[];
  branches: any[];
  isDbConnected: boolean;
}

export default function VehiclesClient({ initialVehicles, branches, isDbConnected }: VehiclesClientProps) {
  const [vehicles, setVehicles] = useState(
    isDbConnected
      ? initialVehicles
      : [
          {
            vin: 'LNAT4AB34T5G05011',
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
            branch: { name: 'มีนบุรี' },
            pdiJobs: [{ id: 'mock-1', pdiType: 'INCOMING', status: 'PENDING' }],
          },
          {
            vin: 'LNAT4AB34T5G05022',
            modelCode: 'HYPTEC_HT',
            modelName: 'HYPTEC HT',
            colorName: 'Rose Gold',
            exteriorColor: 'Rose Gold Satin',
            interiorColor: 'Cream White',
            productionYear: 2026,
            wsDate: '2026-05-15T00:00:00.000Z',
            currentStatus: 'IN_STOCK',
            warehouse: 'Rooftop Lot',
            floorplan: 'Zone B',
            arrivedAt: '2026-06-09T08:00:00.000Z',
            branch: { name: 'มีนบุรี' },
            pdiJobs: [{ id: 'mock-2', pdiType: 'INCOMING', status: 'PENDING_APPROVAL' }],
          },
        ]
  );

  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vin, setVin] = useState('');
  const [modelCode, setModelCode] = useState('AION_V');
  const [colorName, setColorName] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [productionYear, setProductionYear] = useState('2026');
  const [wsDate, setWsDate] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'mock-branch');
  const [warehouse, setWarehouse] = useState('');
  const [floorplan, setFloorplan] = useState('');
  const [loading, setLoading] = useState(false);

  const modelMap: Record<string, string> = {
    AION_V: 'AION V',
    AION_UT: 'AION UT',
    AION_YP: 'AION Y Plus',
    AION_ES: 'AION ES',
    HYPTEC_HT: 'HYPTEC HT',
    HYPTEC_SSR: 'HYPTEC SSR',
    GAC_M8: 'GAC M8',
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vin || !colorName || !wsDate) {
      alert('กรุณากรอกข้อมูลสำคัญ: เลขตัวถัง (VIN), สีหลัก, วันที่ Wholesale');
      return;
    }

    setLoading(true);
    const payload = {
      vin,
      modelCode,
      modelName: modelMap[modelCode],
      colorName,
      exteriorColor,
      interiorColor,
      productionYear: parseInt(productionYear),
      wsDate: new Date(wsDate).toISOString(),
      branchId,
      warehouse,
      floorplan,
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to register vehicle');
        }

        const newVeh = await res.json();
        setVehicles([newVeh, ...vehicles]);
      } else {
        // Local state simulation
        const mockNewVeh = {
          ...payload,
          arrivedAt: new Date().toISOString(),
          currentStatus: 'IN_STOCK',
          branch: { name: branches.find(b => b.id === branchId)?.name || 'มีนบุรี' },
          pdiJobs: [{ id: `mock-${Date.now()}`, pdiType: 'INCOMING', status: 'PENDING' }],
        };
        setVehicles([mockNewVeh, ...vehicles]);
      }

      alert('ลงทะเบียนรถเข้า Stock เรียบร้อย และระบบได้สั่งการสร้าง Incoming PDI Job อัตโนมัติ');
      setIsDialogOpen(false);
      // Reset form
      setVin('');
      setColorName('');
      setExteriorColor('');
      setInteriorColor('');
      setWarehouse('');
      setFloorplan('');
      setWsDate('');
    } catch (err: any) {
      console.error(err);
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">จัดการสต็อกรถยนต์ (Vehicle Stock)</h2>
          <p className="text-xs text-slate-500 mt-1">ทะเบียนรถในระบบ ตรวจสอบประวัติการรับรถและงาน PDI ครบวงจร</p>
        </div>

        {/* Dialog register trigger */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 text-xs font-semibold">
              <Plus className="w-4 h-4 text-slate-950" />
              <span>ลงทะเบียนรับรถใหม่ (Receive Vehicle)</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleRegister}>
              <DialogHeader>
                <DialogTitle>ลงทะเบียนรับรถยนต์เข้าคลังสินค้า</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลรถยนต์จากเรือเพื่อทำการจัดสรรเข้าโกดังเก็บและระบบจะสร้างใบสั่งงาน PDI แรกเริ่มโดยอัตโนมัติ
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-slate-500">เลขตัวถัง (VIN) *</Label>
                  <Input
                    required
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder="เช่น LNAT4AB34T5G05011"
                    className="font-mono text-xs uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">รุ่นโมเดลรถ (Model) *</Label>
                  <Select value={modelCode} onChange={(e: any) => setModelCode(e.target.value)}>
                    {Object.entries(modelMap).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">สีรถภายนอกหลัก (Color Code/Name) *</Label>
                  <Input
                    required
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="เช่น Space Gray"
                    className="text-xs"
                  />
                </div>

                {/* New Custom Fields */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">ลักษณะสีภายนอก (Exterior Color)</Label>
                  <Input
                    value={exteriorColor}
                    onChange={(e) => setExteriorColor(e.target.value)}
                    placeholder="เช่น Gray Metallic / Matte Black"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">โทนสีตกแต่งภายใน (Interior Color)</Label>
                  <Input
                    value={interiorColor}
                    onChange={(e) => setInteriorColor(e.target.value)}
                    placeholder="เช่น Coal Black / Amber Brown"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">ปีที่ผลิตรถ (Production Year)</Label>
                  <Select value={productionYear} onChange={(e: any) => setProductionYear(e.target.value)}>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">วันที่ขายส่งดีลเลอร์ (WSDate) *</Label>
                  <Input
                    required
                    type="date"
                    value={wsDate}
                    onChange={(e) => setWsDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">โซนจอดในคลัง (Warehouse/Zone)</Label>
                  <Input
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    placeholder="เช่น โกดังท่าเรือแหลมฉบัง A"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">ตำแหน่งจอดรถ (Floorplan/Lot)</Label>
                  <Input
                    value={floorplan}
                    onChange={(e) => setFloorplan(e.target.value)}
                    placeholder="เช่น แถว A ล็อต 3"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-slate-500">สาขาที่จัดสรร (Branch)</Label>
                  <Select value={branchId} onChange={(e: any) => setBranchId(e.target.value)}>
                    {isDbConnected && branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))
                    ) : (
                      <option value="mock-branch">สาขามีนบุรี (MBR)</option>
                    )}
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" size="sm">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันลงทะเบียนรับรถ'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stock list table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขตัวถัง (VIN)</TableHead>
                <TableHead>รุ่น (Model)</TableHead>
                <TableHead>สี (ภายนอก/ภายใน)</TableHead>
                <TableHead>ปีผลิต</TableHead>
                <TableHead>โกดัง/ล็อค</TableHead>
                <TableHead>วันที่เข้าคลัง</TableHead>
                <TableHead>สถานะ Stock</TableHead>
                <TableHead>สถานะ PDI</TableHead>
                <TableHead className="text-right">ดูรายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                    ไม่มีข้อมูลรถยนต์ในสต็อก
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((veh) => {
                  // Find current PDI status
                  const latestJob = veh.pdiJobs?.[0];
                  
                  return (
                    <TableRow key={veh.vin}>
                      <TableCell className="font-mono text-xs text-slate-800 font-medium select-all">{veh.vin}</TableCell>
                      <TableCell className="text-xs font-semibold">{veh.modelName}</TableCell>
                      <TableCell className="text-xs">
                        <div className="text-slate-700">{veh.exteriorColor || veh.colorName || '-'}</div>
                        <div className="text-slate-500 text-[10px]">ใน: {veh.interiorColor || '-'}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{veh.productionYear || '-'}</TableCell>
                      <TableCell className="text-xs">
                        <div className="text-slate-700">{veh.warehouse || '-'}</div>
                        <div className="text-slate-500 text-[10px]">{veh.floorplan || '-'}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(veh.arrivedAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            veh.currentStatus === 'DELIVERED'
                              ? 'success'
                              : veh.currentStatus === 'IN_STOCK'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {veh.currentStatus === 'IN_STOCK' && 'ใน Stock'}
                          {veh.currentStatus === 'DELIVERED' && 'ส่งมอบแล้ว'}
                          {veh.currentStatus !== 'IN_STOCK' && veh.currentStatus !== 'DELIVERED' && veh.currentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {latestJob ? (
                          <span className="text-[10px] font-semibold">
                            {latestJob.pdiType}: {' '}
                            {latestJob.status === 'PENDING' && <span className="text-slate-500">รอตรวจ</span>}
                            {latestJob.status === 'IN_PROGRESS' && <span className="text-brand-teal">กำลังตรวจ</span>}
                            {latestJob.status === 'PENDING_APPROVAL' && <span className="text-warning">รอ QC</span>}
                            {latestJob.status === 'APPROVED' && <span className="text-success">อนุมัติแล้ว</span>}
                            {latestJob.status === 'REJECTED' && <span className="text-danger">ถูก Reject</span>}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">ไม่มีงานตรวจ</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/vehicles/${veh.vin}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
