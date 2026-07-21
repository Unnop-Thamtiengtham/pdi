import React from 'react';
import { Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { MODEL_NAMES } from '@/types/pdi';

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  vin: string;
  editVin: string;
  setEditVin: (val: string) => void;
  editModelCode: string;
  setEditModelCode: (val: string) => void;
  editColorName: string;
  setEditColorName: (val: string) => void;
  editExteriorColor: string;
  setEditExteriorColor: (val: string) => void;
  editInteriorColor: string;
  setEditInteriorColor: (val: string) => void;
  editProductionYear: string;
  setEditProductionYear: (val: string) => void;
  editWsDate: string;
  setEditWsDate: (val: string) => void;
  editMotorBatteryNumber: string;
  setEditMotorBatteryNumber: (val: string) => void;
  editWarehouse: string;
  setEditWarehouse: (val: string) => void;
  editFloorplan: string;
  setEditFloorplan: (val: string) => void;
  editBranchId: string;
  setEditBranchId: (val: string) => void;
  dbBranches: any[];
  editLoading: boolean;
}

export function EditVehicleDialog({
  open,
  onOpenChange,
  onSubmit,
  vin,
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
  dbBranches,
  editLoading,
}: EditVehicleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
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
              <Label className="text-xs text-slate-500">ชื่อสีมาตรฐาน (Color Name)</Label>
              <Input
                value={editColorName}
                onChange={(e) => setEditColorName(e.target.value)}
                placeholder="เช่น Rose Gold"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">ลักษณะลักษณะสีภายนอก (Exterior Color)</Label>
              <Input
                value={editExteriorColor}
                onChange={(e) => setEditExteriorColor(e.target.value)}
                placeholder="เช่น สีทูโทนหลังคาดำ"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">โทนตกแต่งภายใน (Interior Color)</Label>
              <Input
                value={editInteriorColor}
                onChange={(e) => setEditInteriorColor(e.target.value)}
                placeholder="เช่น ดำ-ส้ม"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">ปีที่ผลิตรถยนต์ (Production Year)</Label>
              <Input
                type="number"
                value={editProductionYear}
                onChange={(e) => setEditProductionYear(e.target.value)}
                className="text-xs font-mono"
              />
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
  );
}
