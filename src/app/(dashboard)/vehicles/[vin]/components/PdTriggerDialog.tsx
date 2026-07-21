import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface PdTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  salesName: string;
  setSalesName: (val: string) => void;
  salesPhone: string;
  setSalesPhone: (val: string) => void;
  salesBranch: string;
  setSalesBranch: (val: string) => void;
  targetDeliveryDate: string;
  setTargetDeliveryDate: (val: string) => void;
  dbBranches: any[];
  loading: boolean;
}

export function PdTriggerDialog({
  open,
  onOpenChange,
  onSubmit,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  salesName,
  setSalesName,
  salesPhone,
  setSalesPhone,
  salesBranch,
  setSalesBranch,
  targetDeliveryDate,
  setTargetDeliveryDate,
  dbBranches,
  loading,
}: PdTriggerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-100 rounded-xl shadow-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">เปิดใบสั่งงานตรวจเตรียมส่งมอบลูกค้า (Pre-delivery PDI)</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              กรอกรายละเอียดส่งมอบ ทะเบียนผู้ซื้อ และกำหนดวันส่งมอบรถเพื่อบันทึกเตรียมตรวจและรับความยินยอม PDPA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 font-semibold">ชื่อลูกค้าผู้รับรถ *</Label>
              <Input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น นายสมบูรณ์ ดีงาม"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 font-semibold">เบอร์ติดต่อลูกค้า *</Label>
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
                <Label className="text-xs text-slate-500 font-semibold">ชื่อที่ปรึกษาการขาย (Sales) *</Label>
                <Input
                  required
                  value={salesName}
                  onChange={(e) => setSalesName(e.target.value)}
                  placeholder="เช่น สมศักดิ์ การขาย"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-semibold">เบอร์โทรติดต่อ Sales *</Label>
                <Input
                  required
                  value={salesPhone}
                  onChange={(e) => setSalesPhone(e.target.value)}
                  placeholder="เช่น 081-777-8888"
                  className="text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-semibold">สาขาที่ขาย *</Label>
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
                <Label className="text-xs text-slate-500 font-semibold">วันที่กำหนดส่งมอบลูกค้า *</Label>
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
  );
}
