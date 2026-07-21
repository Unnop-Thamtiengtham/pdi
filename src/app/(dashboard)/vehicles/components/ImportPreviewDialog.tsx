'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { modelMap } from '../hooks/useVehicles';

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importVehicles: any[];
  importErrors: string[];
  importLoading: boolean;
  onConfirmImport: () => void;
}

export default function ImportPreviewDialog({
  open,
  onOpenChange,
  importVehicles,
  importErrors,
  importLoading,
  onConfirmImport,
}: ImportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-teal" />
            <span>พรีวิวและตรวจสอบข้อมูลนำเข้า Excel ({importVehicles.length} คัน)</span>
          </DialogTitle>
          <DialogDescription>
            ตรวจสอบความถูกต้องก่อนกดนำเข้าเข้าสู่ระบบ เมื่อสำเร็จระบบจะสร้าง Incoming PDI Job ให้อัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        {importErrors.length > 0 ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>พบข้อผิดพลาดในไฟล์ Excel ({importErrors.length} รายการ) กรุณาแก้ไขแล้วอัปโหลดใหม่:</span>
            </h4>
            <ul className="text-[11px] list-disc pl-4 space-y-1 max-h-48 overflow-y-auto font-medium">
              {importErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
            <span className="text-xs font-semibold">ข้อมูลทั้งหมดผ่านเกณฑ์การตรวจสอบเบื้องต้นแล้ว! พร้อมนำเข้าข้อมูลรถจำนวน {importVehicles.length} คัน</span>
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">เลขตัวถัง (VIN)</TableHead>
                  <TableHead className="text-xs">รุ่นโมเดล</TableHead>
                  <TableHead className="text-xs">สีภายนอก</TableHead>
                  <TableHead className="text-xs">สีภายใน</TableHead>
                  <TableHead className="text-xs">ปีผลิต</TableHead>
                  <TableHead className="text-xs">วันที่ WSDate</TableHead>
                  <TableHead className="text-xs">สาขา</TableHead>
                  <TableHead className="text-xs">โกดัง/โซน/ล็อต</TableHead>
                  <TableHead className="text-xs">เลขมอเตอร์แบตเตอรี่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importVehicles.map((v, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">{v.vin}</TableCell>
                    <TableCell className="text-xs">{modelMap[v.modelCode] || v.modelCode}</TableCell>
                    <TableCell className="text-xs">{v.colorName} {v.exteriorColor ? `(${v.exteriorColor})` : ''}</TableCell>
                    <TableCell className="text-xs">{v.interiorColor || '-'}</TableCell>
                    <TableCell className="text-xs font-mono">{v.productionYear || '-'}</TableCell>
                    <TableCell className="text-xs font-mono">{v.wsDate}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{v.branchCode}</TableCell>
                    <TableCell className="text-xs">{v.warehouse || '-'} / {v.floorplan || '-'} {v.lotNumber ? `/ ล็อต: ${v.lotNumber}` : ''}</TableCell>
                    <TableCell className="text-xs font-mono">{v.motorBatteryNumber || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="sm">
              ยกเลิก
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={onConfirmImport} 
            disabled={importErrors.length > 0 || importLoading}
            size="sm"
          >
            {importLoading ? 'กำลังนำเข้าข้อมูล...' : 'ยืนยันนำเข้าข้อมูล'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
