import React from 'react';
import { Wrench, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface SendRepairDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedJob: any;
  repairDate: string;
  setRepairDate: (val: string) => void;
  repairLocation: string;
  setRepairLocation: (val: string) => void;
  customLocation: string;
  setCustomLocation: (val: string) => void;
  repairNotes: string;
  setRepairNotes: (val: string) => void;
  submitting: boolean;
  dbBranches: any[];
}

export function SendRepairDialog({
  open,
  onOpenChange,
  onSubmit,
  selectedJob,
  repairDate,
  setRepairDate,
  repairLocation,
  setRepairLocation,
  customLocation,
  setCustomLocation,
  repairNotes,
  setRepairNotes,
  submitting,
  dbBranches,
}: SendRepairDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-slate-100 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3 mb-2">
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-teal" />
              <span>{selectedJob?.sentToRepairAt ? 'แก้ไขรายละเอียดส่งซ่อม/ปรับสภาพ' : 'ดำเนินการนำรถส่งซ่อม/ปรับสภาพ'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              เลขที่งาน: <span className="font-mono font-semibold text-slate-700">{selectedJob?.jobNumber}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Vehicle Info Summary */}
          {selectedJob && (
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium">รุ่นรถ (Model):</span>
                <span className="font-semibold text-slate-800">{selectedJob.vehicle?.modelName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">เลขตัวถัง (VIN):</span>
                <span className="font-mono font-semibold text-slate-800">{selectedJob.vehicleVin}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">สีรถ (Color):</span>
                <span className="font-semibold text-slate-800">{selectedJob.vehicle?.colorName || '-'}</span>
              </div>
            </div>
          )}

          {/* Defects Checklist Summary with Photos */}
          {selectedJob && selectedJob.defects && selectedJob.defects.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                จุดบกพร่องที่ต้องซ่อมแซม ({selectedJob.defects.length} จุด)
              </Label>
              <div className="max-h-52 overflow-y-auto border border-slate-100 rounded-lg p-2.5 bg-slate-50/40 space-y-3 text-xs">
                {selectedJob.defects.map((defect: any, idx: number) => (
                  <div key={defect.id || idx} className="space-y-1.5">
                    <div className="flex gap-2 text-slate-600 items-start">
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
                        {defect.defectNo || (idx + 1)}
                      </span>
                      <span className="leading-tight">{defect.description}</span>
                    </div>
                    {/* Defect photos from inspector */}
                    {defect.photoUrls && defect.photoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-6">
                        {defect.photoUrls.map((url: string, pIdx: number) => (
                          <a
                            key={pIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-14 h-14 rounded-md overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                          >
                            <img
                              src={url}
                              alt={`จุดชำรุดที่ ${defect.defectNo || (idx + 1)} - รูปที่ ${pIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                        <span className="self-end text-[10px] text-slate-400 font-medium">
                          {defect.photoUrls.length} รูป
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5 pt-1">
            {/* Repair Date */}
            <div className="space-y-1">
              <Label htmlFor="repair-date" className="text-xs font-semibold text-slate-700">
                วันที่และเวลาส่งซ่อม
              </Label>
              <Input
                id="repair-date"
                type="datetime-local"
                required
                value={repairDate}
                onChange={(e) => setRepairDate(e.target.value)}
                className="text-xs h-9 border-slate-200 focus:border-brand-teal focus:ring-brand-teal"
              />
            </div>

            {/* Repair Location */}
            <div className="space-y-1">
              <Label htmlFor="repair-location" className="text-xs font-semibold text-slate-700">
                สถานที่ส่งซ่อม / อู่ที่รับผิดชอบ
              </Label>
              <Select
                id="repair-location"
                value={repairLocation}
                onChange={(e) => setRepairLocation(e.target.value)}
                className="text-xs h-9 border-slate-200"
              >
                {dbBranches.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
                <option value="อื่น ๆ">อื่น ๆ (ระบุเอง)</option>
              </Select>
            </div>

            {/* Custom Location (conditional) */}
            {repairLocation === 'อื่น ๆ' && (
              <div className="space-y-1 animate-in fade-in-50 duration-200">
                <Label htmlFor="custom-location" className="text-xs font-semibold text-slate-700">
                  ระบุสถานที่ส่งซ่อม
                </Label>
                <Input
                  id="custom-location"
                  required
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="กรอกชื่ออู่ หรือ แผนก..."
                  className="text-xs h-9 border-slate-200 focus:border-brand-teal focus:ring-brand-teal"
                />
              </div>
            )}

            {/* Repair Notes */}
            <div className="space-y-1">
              <Label htmlFor="repair-notes" className="text-xs font-semibold text-slate-700">
                หมายเหตุ / คำสั่งซ่อมเพิ่มเติม (ถ้ามี)
              </Label>
              <textarea
                id="repair-notes"
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="เช่น ขัดลบรอยขีดข่วน หรือ ตรวจเช็คกลไกเป็นพิเศษ..."
                className="w-full text-xs min-h-[70px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-semibold"
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-9 px-4 text-xs font-semibold"
              disabled={submitting}
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
