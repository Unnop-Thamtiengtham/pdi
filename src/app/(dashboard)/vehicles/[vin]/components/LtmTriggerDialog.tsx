import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface LtmTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  ltmInterval: string;
  setLtmInterval: (val: string) => void;
  ltmScheduledDate: string;
  setLtmScheduledDate: (val: string) => void;
  loading: boolean;
}

export function LtmTriggerDialog({
  open,
  onOpenChange,
  onSubmit,
  ltmInterval,
  setLtmInterval,
  ltmScheduledDate,
  setLtmScheduledDate,
  loading,
}: LtmTriggerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-100 rounded-xl shadow-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">เปิดใบสั่งงานตรวจบำรุงรักษาระยะยาว</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              ระบุรอบการตรวจและวันกำหนดตรวจเพื่อจัดสร้างใบสั่งงานสำหรับรถที่ค้าง Stock เกินเวลากำหนด
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 font-semibold">รอบการตรวจบำรุงรักษา (Interval)</Label>
              <Select value={ltmInterval} onChange={(e: any) => setLtmInterval(e.target.value)}>
                <option value="30">30 วัน (รอบแรก)</option>
                <option value="60">60 วัน (รอบสอง)</option>
                <option value="90">90 วัน (รอบสาม)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 font-semibold">วันที่กำหนดให้ตรวจสภาพ</Label>
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
  );
}
