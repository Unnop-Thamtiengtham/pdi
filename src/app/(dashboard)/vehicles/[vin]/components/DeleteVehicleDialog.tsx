import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  vin: string;
  modelName: string;
  confirmVin: string;
  setConfirmVin: (val: string) => void;
  loading: boolean;
  pdiJobCount: number;
  defectCount: number;
}

export function DeleteVehicleDialog({
  open,
  onOpenChange,
  onConfirm,
  vin,
  modelName,
  confirmVin,
  setConfirmVin,
  loading,
  pdiJobCount,
  defectCount,
}: DeleteVehicleDialogProps) {
  const isConfirmed = confirmVin.trim().toUpperCase() === vin.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>ลบรถยนต์ออกจากระบบ</span>
          </DialogTitle>
          <DialogDescription>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบถาวร
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Vehicle info */}
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-red-800">
              รถยนต์ที่จะถูกลบ:
            </p>
            <div className="text-xs text-red-700 space-y-1">
              <p>
                <span className="text-red-500">VIN:</span>{' '}
                <span className="font-mono font-bold">{vin}</span>
              </p>
              <p>
                <span className="text-red-500">รุ่น:</span>{' '}
                <span className="font-medium">{modelName}</span>
              </p>
            </div>
          </div>

          {/* Cascade warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-[11px] font-semibold text-amber-800 mb-1.5">
              ⚠️ ข้อมูลต่อไปนี้จะถูกลบไปด้วย:
            </p>
            <ul className="text-[11px] text-amber-700 space-y-0.5 list-disc list-inside">
              <li>ใบงาน PDI ทั้งหมด ({pdiJobCount} งาน)</li>
              <li>ผลตรวจ Checklist ทั้งหมด</li>
              <li>จุดบกพร่อง/ซ่อม ({defectCount} จุด)</li>
              <li>เอกสารแนบ และผลทดสอบแบตเตอรี่</li>
              <li>ประวัติการแก้ไขข้อมูลรถ</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 font-semibold">
              พิมพ์เลขตัวถัง (VIN) เพื่อยืนยันการลบ
            </Label>
            <Input
              value={confirmVin}
              onChange={(e) => setConfirmVin(e.target.value)}
              placeholder={vin}
              className="text-xs font-mono uppercase border-red-200 focus:border-red-400 focus:ring-red-400/20"
              autoComplete="off"
            />
            {confirmVin.length > 0 && !isConfirmed && (
              <p className="text-[10px] text-red-500 font-medium">
                เลขตัวถังไม่ตรงกัน กรุณาพิมพ์ใหม่
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="sm" className="cursor-pointer">
              ยกเลิก
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            disabled={!isConfirmed || loading}
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'กำลังลบ...' : 'ยืนยันลบรถยนต์'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
