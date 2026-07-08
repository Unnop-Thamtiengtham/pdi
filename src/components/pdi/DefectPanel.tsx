'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertTriangle, Camera, ImagePlus, Loader2, X } from 'lucide-react';
import PhotoUpload from './PhotoUpload';
import { toast } from 'sonner';

interface Defect {
  id?: string;
  checklistItemCode?: string | null;
  description: string;
  cause?: string | null;
  solution?: string | null;
  severity: string; // "NORMAL" | "CRITICAL"
  status: string; // "OPEN" | "IN_REPAIR" | "RESOLVED" | "CLOSED"
  photoUrls?: string[];
  // Legacy support
  photoUrl?: string | null;
}

interface ChecklistItemRef {
  itemCode: string;
  itemName: string;
}

interface DefectPanelProps {
  jobId: string;
  defects: Defect[];
  onChange: (defects: Defect[]) => void;
  checklistItemCodes?: string[];
  checklistItems?: ChecklistItemRef[];
  readOnly?: boolean;
}

/** Helper: get photo URLs from defect (supports both old photoUrl and new photoUrls) */
function getDefectPhotos(defect: Defect): string[] {
  if (defect.photoUrls && defect.photoUrls.length > 0) {
    return defect.photoUrls;
  }
  if (defect.photoUrl) {
    return [defect.photoUrl];
  }
  return [];
}

export default function DefectPanel({
  jobId,
  defects,
  onChange,
  checklistItemCodes = [],
  checklistItems = [],
  readOnly = false,
}: DefectPanelProps) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('NORMAL');
  const [itemCode, setItemCode] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newDefect: Defect = {
      description,
      severity,
      checklistItemCode: itemCode || null,
      status: 'OPEN',
      photoUrls,
    };

    onChange([...defects, newDefect]);
    setDescription('');
    setSeverity('NORMAL');
    setItemCode('');
    setPhotoUrls([]);
  };

  const handleRemoveDefect = (index: number) => {
    const updated = defects.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleStatusChange = (index: number, newStatus: string) => {
    const updated = defects.map((d, i) => {
      if (i === index) {
        return { ...d, status: newStatus };
      }
      return d;
    });
    onChange(updated);
  };

  /** Update photos for an existing defect */
  const handleDefectPhotosChange = (index: number, newUrls: string[]) => {
    const updated = defects.map((d, i) => {
      if (i === index) {
        return { ...d, photoUrls: newUrls, photoUrl: newUrls[0] || null };
      }
      return d;
    });
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span>บันทึกจุดบกพร่อง / Defect Panel ({defects.length})</span>
        </CardTitle>
        <p className="text-xs text-slate-500">กรณีมีรายการไม่ผ่านเกณฑ์ (FAIL) บันทึกและระบุรายละเอียดเพื่อแจ้งแก้ไข</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Defect Form */}
        {!readOnly && (
          <form onSubmit={handleAddDefect} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-semibold text-brand-teal uppercase tracking-wider">เพิ่มจุดบกพร่องใหม่</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-slate-500">รายละเอียดปัญหา *</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุจุดบกพร่องและตำแหน่ง เช่น รอยรอยขีดข่วนกันชนหน้าซ้าย"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">ระดับความรุนแรง</Label>
                <Select value={severity} onChange={(e: any) => setSeverity(e.target.value)}>
                  <option value="NORMAL">ปกติ (NORMAL)</option>
                  <option value="CRITICAL">รุนแรง (CRITICAL - ต้องซ่อมด่วน)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">อ้างอิงรหัสรายการตรวจ (เลือกจาก Checklist)</Label>
                <Select value={itemCode} onChange={(e: any) => setItemCode(e.target.value)}>
                  <option value="">-- ไม่อ้างอิง --</option>
                  {checklistItems && checklistItems.length > 0 ? (
                    checklistItems.map((item) => (
                      <option key={item.itemCode} value={item.itemCode}>
                        {item.itemCode} - {item.itemName}
                      </option>
                    ))
                  ) : (
                    checklistItemCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))
                  )}
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">แนบรูปภาพปัญหา (สูงสุด 3 รูป)</Label>
                <PhotoUpload
                  value={photoUrls}
                  onChange={setPhotoUrls}
                  maxPhotos={3}
                  folder={`PDI/defects/${jobId}`}
                  placeholder="คลิกถ่ายรูปหรืออัปโหลด"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> เพิ่มรายการ Defect
              </Button>
            </div>
          </form>
        )}

        {/* Defects List */}
        {defects.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
            ไม่มีรายการจุดบกพร่องที่บันทึก
          </div>
        ) : (
          <div className="space-y-3">
            {defects.map((defect, index) => {
              const photos = getDefectPhotos(defect);
              return (
                <div
                  key={index}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border bg-slate-50 ${
                    defect.severity === 'CRITICAL' ? 'border-error/20 bg-error/5' : 'border-slate-200'
                  }`}
                >
                  <div className="flex gap-4 items-start flex-1">
                    {/* Photo thumbnails or upload button */}
                    <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                      {photos.length > 0 ? (
                        photos.map((url, pIdx) => (
                          <div key={pIdx} className="relative w-14 h-14 rounded overflow-hidden border border-slate-200 group">
                            <img
                              src={url}
                              alt={`Defect ${index + 1} photo ${pIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = photos.filter((_, i) => i !== pIdx);
                                  handleDefectPhotosChange(index, updated);
                                }}
                                className="absolute top-0 right-0 bg-black/60 hover:bg-red-600 text-white rounded-bl p-0.5 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : null}

                      {/* Add photo button on existing defect (if not readOnly and < maxPhotos) */}
                      {!readOnly && photos.length < 3 && (
                        <InlinePhotoAdd
                          jobId={jobId}
                          currentPhotos={photos}
                          onPhotosChange={(newUrls) => handleDefectPhotosChange(index, newUrls)}
                          hasPhotos={photos.length > 0}
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">#{index + 1} {defect.description}</span>
                        {defect.checklistItemCode && (
                          <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-100">
                            อ้างอิง: {defect.checklistItemCode}
                          </Badge>
                        )}
                        {defect.severity === 'CRITICAL' ? (
                          <Badge variant="danger">CRITICAL</Badge>
                        ) : (
                          <Badge variant="default">NORMAL</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        สถานะ: {' '}
                        {defect.status === 'OPEN' && <span className="text-error font-medium">รอแก้ไข (OPEN)</span>}
                        {defect.status === 'IN_REPAIR' && <span className="text-warning font-medium">กำลังซ่อม (IN REPAIR)</span>}
                        {defect.status === 'RESOLVED' && <span className="text-success font-medium">แก้ไขแล้ว (RESOLVED)</span>}
                        {defect.status === 'CLOSED' && <span className="text-slate-500 font-medium">ปิดงาน (CLOSED)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
                    {!readOnly ? (
                      <>
                        <Select
                          value={defect.status}
                          onChange={(e: any) => handleStatusChange(index, e.target.value)}
                          className="h-8 text-xs py-1"
                        >
                          <option value="OPEN">รอแก้ไข (OPEN)</option>
                          <option value="IN_REPAIR">กำลังซ่อม (IN REPAIR)</option>
                          <option value="RESOLVED">แก้ไขแล้ว (RESOLVED)</option>
                          <option value="CLOSED">ปิดงาน (CLOSED)</option>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDefect(index)}
                          className="text-slate-500 hover:text-error h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      // Show readonly status badge
                      <Badge
                        variant={
                          defect.status === 'OPEN'
                            ? 'danger'
                            : defect.status === 'IN_REPAIR'
                            ? 'warning'
                            : defect.status === 'RESOLVED'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {defect.status}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Inline photo add button for existing defect items.
 * Has its own file input and upload logic.
 */
function InlinePhotoAdd({
  jobId,
  currentPhotos,
  onPhotosChange,
  hasPhotos,
}: {
  jobId: string;
  currentPhotos: string[];
  onPhotosChange: (urls: string[]) => void;
  hasPhotos: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ');
        return;
      }

      setUploading(true);
      try {
        // Client-side resize
        const resizedBlob = await resizeForUpload(file);

        const formData = new FormData();
        const uploadFile = new File([resizedBlob], file.name, { type: resizedBlob.type || 'image/jpeg' });
        formData.append('file', uploadFile);
        formData.append('folder', `PDI/defects/${jobId}`);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }

        const data = await res.json();
        onPhotosChange([...currentPhotos, data.fileUrl]);
        toast.success('อัปโหลดรูปสำเร็จ');
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'อัปโหลดรูปไม่สำเร็จ');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [currentPhotos, onPhotosChange]
  );

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFile}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className={`flex flex-col items-center justify-center rounded border-2 border-dashed transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          hasPhotos
            ? 'w-14 h-14 border-slate-300 text-slate-400 hover:text-brand-teal hover:border-brand-teal'
            : 'w-16 h-16 border-slate-300 bg-slate-100 text-slate-400 hover:text-brand-teal hover:border-brand-teal hover:bg-brand-teal/5'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-teal" />
        ) : (
          <Camera className={hasPhotos ? 'w-4 h-4' : 'w-5 h-5'} />
        )}
        {!hasPhotos && (
          <span className="text-[8px] font-medium mt-0.5">ถ่ายรูป</span>
        )}
      </button>
    </>
  );
}

/** Quick resize for inline upload */
async function resizeForUpload(file: File, maxDim = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) { resolve(file); return; }
      if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
      else { width = Math.round((width / height) * maxDim); height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas ctx')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
