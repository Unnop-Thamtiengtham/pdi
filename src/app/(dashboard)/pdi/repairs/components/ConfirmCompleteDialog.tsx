import React, { useRef } from 'react';
import { Camera, X, ImagePlus, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmJob: any;
  repairPhotos: Record<string, string[]>;
  photoUploading: Record<string, boolean>;
  onPhotoUpload: (defectId: string, file: File) => void;
  onRemovePhoto: (defectId: string, url: string) => void;
  onConfirm: () => void;
  confirmSubmitting: boolean;
}

export function ConfirmCompleteDialog({
  open,
  onOpenChange,
  confirmJob,
  repairPhotos,
  photoUploading,
  onPhotoUpload,
  onRemovePhoto,
  onConfirm,
  confirmSubmitting,
}: ConfirmCompleteDialogProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeDefects = confirmJob?.defects?.filter((d: any) => d.status === 'OPEN' || d.status === 'IN_REPAIR') || [];
  const missingCount = activeDefects.filter((d: any) => !(repairPhotos[d.id]?.length > 0)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-slate-100 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-3">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-800">
            ยืนยันการซ่อมแซมเสร็จสิ้น
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 max-w-sm">
            คุณต้องการยืนยันว่าการซ่อมแซมสำหรับงานเลขที่{' '}
            <span className="font-mono font-bold text-slate-700">{confirmJob?.jobNumber}</span>{' '}
            เสร็จสิ้นแล้วใช่หรือไม่?
          </DialogDescription>
        </DialogHeader>

        {/* Repair Photo Upload Section */}
        {activeDefects.length > 0 && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2 px-1">
              <Camera className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-700">แนบรูปหลังซ่อมทุกจุด (บังคับ อย่างน้อย 1 รูป)</span>
            </div>

            <div className="space-y-3">
              {activeDefects.map((defect: any, idx: number) => {
                const defectPhotos = repairPhotos[defect.id] || [];
                const isUploading = photoUploading[defect.id] || false;
                const hasPhotos = defectPhotos.length > 0;

                return (
                  <div
                    key={defect.id}
                    className={cn(
                      'border rounded-lg p-3 transition-all',
                      hasPhotos
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-amber-200 bg-amber-50/20'
                    )}
                  >
                    {/* Defect header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={cn(
                          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                          hasPhotos
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        )}>
                          {defect.defectNo || (idx + 1)}
                        </span>
                        <span className="text-xs text-slate-700 leading-tight">{defect.description}</span>
                      </div>
                      {hasPhotos ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          ครบแล้ว
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <ShieldAlert className="w-3 h-3" />
                          ขาดรูป
                        </span>
                      )}
                    </div>

                    {/* Photo thumbnails */}
                    {defectPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {defectPhotos.map((url, pIdx) => (
                          <div key={pIdx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img
                              src={url}
                              alt={`รูปหลังซ่อม ${pIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => onRemovePhoto(defect.id, url)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    {defectPhotos.length < 3 && (
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[defect.id] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onPhotoUpload(defect.id, file);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[defect.id]?.click()}
                          className="h-7 gap-1.5 text-[11px] font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>กำลังอัปโหลด...</span>
                            </>
                          ) : (
                            <>
                              <ImagePlus className="w-3.5 h-3.5" />
                              <span>เพิ่มรูป ({defectPhotos.length}/3)</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning info */}
        <div className="my-2 bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-700">คำเตือน / ข้อมูลสำคัญ:</p>
            <p className="mt-0.5">การยืนยันจะเปลี่ยนสถานะจุดบกพร่องทั้งหมดของงานนี้เป็น <span className="font-semibold text-emerald-600">แก้ไขแล้ว</span> และนำรถกลับเข้าสู่สถานะ <span className="font-semibold text-blue-600">In Stock</span> ทันที</p>
          </div>
        </div>

        {/* Missing photos indicator */}
        {missingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">ยังขาดรูปหลังซ่อมอีก {missingCount} จุด</span>
          </div>
        )}

        <div className="mt-4 border-t pt-3 flex justify-center items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={confirmSubmitting}
          >
            ยกเลิก (Cancel)
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              confirmSubmitting ||
              missingCount > 0 ||
              Object.values(photoUploading).some(Boolean)
            }
          >
            {confirmSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                ยืนยันการซ่อมเสร็จ
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
