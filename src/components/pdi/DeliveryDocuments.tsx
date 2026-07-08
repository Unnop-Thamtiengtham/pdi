'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, AlertCircle, Trash2, Upload, Eye, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

interface JobDocument {
  id: string;
  jobId: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface DeliveryDocumentsProps {
  jobId: string;
  vin: string;
  jobNumber: string;
  initialDocuments?: JobDocument[];
  readOnly?: boolean;
}

const DOCUMENTS_CONFIG = [
  { type: 'PDI_CHECKLIST', nameTh: '1. ใบรายงาน PDI Sheet', nameEn: 'PDI Checklist Sheet' },
  { type: 'BATTERY_REPORT', nameTh: '2. ผลทดสอบแบตเตอรี่ 12V', nameEn: 'Battery 12V Test Report' },
  { type: 'VEHICLE_REPORT', nameTh: '3. รายงานสภาพตัวรถ (Vehicle Report)', nameEn: 'Vehicle Inspection Report' },
  { type: 'PDPA_CONSENT', nameTh: '4. เอกสารยินยอม PDPA', nameEn: 'PDPA Consent Form' },
  { type: 'LIFETIME_WARRANTY', nameTh: '5. เอกสารรับประกัน Lifetime Warranty', nameEn: 'Lifetime Warranty Certificate' },
  { type: 'DELIVERY_FORM', nameTh: '6. ใบส่งมอบรถยนต์ (Handover Form)', nameEn: 'Delivery Handover Form' },
];

export default function DeliveryDocuments({
  jobId,
  vin,
  jobNumber,
  initialDocuments = [],
  readOnly = false,
}: DeliveryDocumentsProps) {
  const [documents, setDocuments] = useState<JobDocument[]>(initialDocuments);
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});
  const [activeType, setActiveType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMerging, setIsMerging] = useState(false);

  const convertImageToJpgBytes = async (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (b) => {
            if (b) {
              resolve(await b.arrayBuffer());
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          0.9
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handlePrintAll = async () => {
    if (isMerging || documents.length === 0) return;

    setIsMerging(true);
    const toastId = toast.loading('กำลังดาวน์โหลดและรวมไฟล์เป็น PDF เดียว...');

    try {
      const mergedPdf = await PDFDocument.create();
      let hasContent = false;

      for (const config of DOCUMENTS_CONFIG) {
        const doc = getDocByType(config.type);
        if (!doc) continue;

        const proxyUrl = `/api/pdi-jobs/documents/download?url=${encodeURIComponent(doc.fileUrl)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          throw new Error(`ไม่สามารถโหลดเอกสาร: ${config.nameTh}`);
        }

        const contentType = res.headers.get('content-type') || '';
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();

        if (contentType.includes('pdf')) {
          const srcPdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          hasContent = true;
        } else if (contentType.includes('image')) {
          const jpgBytes = await convertImageToJpgBytes(blob);
          const embeddedImage = await mergedPdf.embedJpg(jpgBytes);
          const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1);

          const page = mergedPdf.addPage([595.275, 841.89]);
          const margin = 20;
          const maxWidth = 595.275 - margin * 2;
          const maxHeight = 841.89 - margin * 2;

          let drawWidth = imgWidth;
          let drawHeight = imgHeight;

          if (drawWidth > maxWidth) {
            drawHeight = (maxWidth / drawWidth) * drawHeight;
            drawWidth = maxWidth;
          }
          if (drawHeight > maxHeight) {
            drawWidth = (maxHeight / drawHeight) * drawWidth;
            drawHeight = maxHeight;
          }

          const x = (595.275 - drawWidth) / 2;
          const y = (841.89 - drawHeight) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
          });
          hasContent = true;
        }
      }

      if (!hasContent) {
        throw new Error('ไม่มีเอกสารที่สามารถพิมพ์ได้');
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(mergedBlob);

      window.open(pdfUrl, '_blank');
      toast.success('รวมเอกสารสำเร็จ! เปิดแท็บใหม่เพื่อพิมพ์', { id: toastId });
    } catch (err: any) {
      console.error('Error merging documents:', err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการรวมเอกสาร', { id: toastId });
    } finally {
      setIsMerging(false);
    }
  };

  // Sync state if initialDocuments changes
  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  // Find document by type
  const getDocByType = (docType: string) => {
    return documents.find((doc) => doc.docType === docType);
  };

  const handleUploadClick = (docType: string) => {
    if (readOnly || uploadingMap[docType]) return;
    setActiveType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear value
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeType) return;

    // Validate size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`ไฟล์ใหญ่เกินไป (สูงสุด 5 MB)`);
      return;
    }

    // Validate type (Images & PDF allowed)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะรูปภาพ (JPEG, PNG, WebP) และ PDF เท่านั้น');
      return;
    }

    setUploadingMap((prev) => ({ ...prev, [activeType]: true }));
    const toastId = toast.loading(`กำลังอัปโหลด ${file.name}...`);

    try {
      // 1. Upload to S3
      const formData = new FormData();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\.[^.]+$/, '');
      const customFileName = `${activeType}_${cleanFileName}.${fileExt}`;
      const renamedFile = new File([file], customFileName, { type: file.type });

      formData.append('file', renamedFile);
      formData.append('folder', `PDI/${vin}/${jobNumber}`);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'ไม่สามารถอัปโหลดไฟล์ไปยังเซิร์ฟเวอร์ได้');
      }

      const uploadData = await uploadRes.json();

      // 2. Save document record to DB
      const saveRes = await fetch('/api/pdi-jobs/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          docType: activeType,
          fileName: file.name,
          fileUrl: uploadData.fileUrl,
          fileSize: file.size,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'ไม่สามารถบันทึกประวัติเอกสารได้');
      }

      const newDoc = await saveRes.json();

      // 3. Update state
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.docType !== activeType);
        return [...filtered, newDoc];
      });

      toast.success(`อัปโหลดเอกสารสำเร็จ!`, { id: toastId });
    } catch (err: any) {
      console.error('Upload document error:', err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', { id: toastId });
    } finally {
      setUploadingMap((prev) => ({ ...prev, [activeType]: false }));
      setActiveType(null);
    }
  };

  const handleDeleteClick = async (docType: string) => {
    if (readOnly || deletingMap[docType]) return;

    if (!confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return;

    setDeletingMap((prev) => ({ ...prev, [docType]: true }));
    const toastId = toast.loading('กำลังลบเอกสาร...');

    try {
      const res = await fetch(`/api/pdi-jobs/documents?jobId=${jobId}&docType=${docType}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ไม่สามารถลบเอกสารได้');
      }

      setDocuments((prev) => prev.filter((d) => d.docType !== docType));
      toast.success('ลบเอกสารสำเร็จ', { id: toastId });
    } catch (err: any) {
      console.error('Delete document error:', err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการลบเอกสาร', { id: toastId });
    } finally {
      setDeletingMap((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const formatBytes = (bytes?: number | null) => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadedCount = documents.length;
  const totalCount = DOCUMENTS_CONFIG.length;
  const progressPercent = Math.round((uploadedCount / totalCount) * 100);

  return (
    <Card className="border border-slate-200 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-teal" />
              <span>เอกสารประกอบการส่งมอบรถ / Handover Documents</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              อัปโหลดเอกสารสำคัญประกอบการตรวจสภาพและการส่งมอบรถทั้ง 6 ฉบับ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
            {uploadedCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isMerging}
                onClick={handlePrintAll}
                className="border-brand-teal text-brand-teal hover:bg-brand-teal/5 text-xs font-semibold flex items-center gap-1.5 h-8 px-3"
              >
                {isMerging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>พิมพ์เอกสารทั้งหมด (Print All)</span>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                อัปโหลดแล้ว {uploadedCount} จาก {totalCount}
              </span>
              <Badge variant={progressPercent === 100 ? 'success' : 'default'} className="text-[10px]">
                {progressPercent}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-success' : 'bg-brand-teal'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          className="hidden"
          disabled={readOnly}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCUMENTS_CONFIG.map((config) => {
            const doc = getDocByType(config.type);
            const isUploading = uploadingMap[config.type];
            const isDeleting = deletingMap[config.type];

            return (
              <div
                key={config.type}
                className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between gap-3 ${
                  doc
                    ? 'bg-success/5 border-success/20 hover:bg-success/10'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      {config.nameTh}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {config.nameEn}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isUploading ? (
                    <Badge className="bg-slate-100 text-slate-500 animate-pulse border-transparent text-[10px] flex items-center gap-1 font-normal">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-teal" />
                      <span>กำลังอัปโหลด...</span>
                    </Badge>
                  ) : doc ? (
                    <Badge variant="success" className="text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>อัปโหลดแล้ว</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-600 border border-amber-200/50 hover:bg-amber-50 text-[10px] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span>รออัปโหลด</span>
                    </Badge>
                  )}
                </div>

                {/* Uploaded File Info */}
                {doc && (
                  <div className="text-[11px] text-slate-500 bg-white/70 px-2.5 py-1.5 rounded-md border border-success/10 space-y-1">
                    <div className="font-mono truncate font-medium text-slate-700" title={doc.fileName}>
                      📂 {doc.fileName}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>ขนาด: {formatBytes(doc.fileSize)}</span>
                      <span>วันที่: {new Date(doc.uploadedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-auto">
                  {doc ? (
                    <>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-slate-600 border-slate-200 hover:bg-slate-50 text-[11px] font-medium flex items-center justify-center gap-1.5 h-7"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>ดูเอกสาร</span>
                        </Button>
                      </a>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDeleteClick(config.type)}
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 text-[11px] flex items-center justify-center gap-1.5 h-7 px-2.5"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={readOnly || isUploading}
                      onClick={() => handleUploadClick(config.type)}
                      className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal/5 text-[11px] font-semibold flex items-center justify-center gap-1.5 h-7"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดไฟล์</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
