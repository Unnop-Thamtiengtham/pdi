import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  employeeId: string;
  loading: boolean;
}

export function ConfirmDeleteUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  employeeId,
  loading,
}: ConfirmDeleteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-655 font-bold">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-slate-800">ยืนยันการลบผู้ใช้งาน</span>
          </DialogTitle>
          <DialogDescription>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้ บัญชีผู้ใช้งานนี้จะถูกลบออกจากระบบทันที
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User info */}
          <div className="rounded-lg bg-red-50 border border-red-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-red-800">
              ผู้ใช้งานที่จะถูกลบ:
            </p>
            <div className="text-xs text-red-700 space-y-1">
              <p>
                <span className="text-red-500 font-semibold">ชื่อ:</span>{' '}
                <span className="font-bold text-slate-850">{userName}</span>
              </p>
              <p>
                <span className="text-red-500 font-semibold">รหัสพนักงาน:</span>{' '}
                <span className="font-mono font-bold text-slate-855">{employeeId}</span>
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="sm" className="cursor-pointer" disabled={loading}>
              ยกเลิก
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={loading}
            onClick={onConfirm}
            className="cursor-pointer disabled:opacity-50"
          >
            {loading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
