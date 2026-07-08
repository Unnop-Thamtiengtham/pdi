'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, Loader2, Plus, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  /** Array of uploaded URLs (multi-photo mode) */
  value?: string[];
  /** Called with updated array of URLs */
  onChange: (urls: string[]) => void;
  /** Max number of photos allowed */
  maxPhotos?: number;
  /** Max file size in bytes */
  maxFileSize?: number;
  /** S3 folder prefix */
  folder?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Disable interactions */
  disabled?: boolean;
}

/**
 * Resize an image on the client side using canvas.
 * Reduces the largest dimension to maxDimension (default 1920px).
 * Returns a Blob (JPEG at 85% quality).
 */
async function resizeImage(file: File, maxDimension = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than maxDimension
      if (width <= maxDimension && height <= maxDimension) {
        // Return original file as blob (no resize needed)
        resolve(file);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        height = Math.round((height / width) * maxDimension);
        width = maxDimension;
      } else {
        width = Math.round((width / height) * maxDimension);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export default function PhotoUpload({
  value = [],
  onChange,
  maxPhotos = 3,
  maxFileSize = 5 * 1024 * 1024,
  folder = 'PDI/defects',
  placeholder = 'ถ่ายรูป / อัปโหลด',
  disabled = false,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = maxPhotos - value.length;
      if (remaining <= 0) {
        toast.error(`อัปโหลดได้สูงสุด ${maxPhotos} รูปต่อรายการ`);
        return;
      }

      // Take only remaining slots
      const selectedFiles = Array.from(files).slice(0, remaining);

      setUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of selectedFiles) {
          // Validate file size (before resize)
          if (file.size > maxFileSize * 2) {
            // Allow up to 2x since we'll resize
            toast.error(`ไฟล์ "${file.name}" ใหญ่เกินไป (สูงสุด ${Math.round(maxFileSize * 2 / 1024 / 1024)} MB)`);
            continue;
          }

          // Validate type
          if (!file.type.startsWith('image/')) {
            toast.error(`"${file.name}" ไม่ใช่ไฟล์รูปภาพ`);
            continue;
          }

          // Client-side resize
          const resizedBlob = await resizeImage(file, 1920);

          // Check resized size
          if (resizedBlob.size > maxFileSize) {
            toast.error(`ไฟล์ "${file.name}" ยังใหญ่เกินไปหลัง resize (${(resizedBlob.size / 1024 / 1024).toFixed(1)} MB)`);
            continue;
          }

          // Upload to S3
          const formData = new FormData();
          const ext = file.name.split('.').pop() || 'jpg';
          const uploadFile = new File([resizedBlob], file.name.replace(/\.[^.]+$/, `.${resizedBlob.type === 'image/jpeg' ? 'jpg' : ext}`), {
            type: resizedBlob.type || 'image/jpeg',
          });
          formData.append('file', uploadFile);
          formData.append('folder', folder);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
          }

          const data = await res.json();
          newUrls.push(data.fileUrl);
        }

        if (newUrls.length > 0) {
          onChange([...value, ...newUrls]);
          toast.success(`อัปโหลดสำเร็จ ${newUrls.length} รูป`);
        }
      } catch (err: any) {
        console.error('Photo upload error:', err);
        toast.error(err.message || 'ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่');
      } finally {
        setUploading(false);
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [value, onChange, maxPhotos, maxFileSize, folder]
  );

  const handleTrigger = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const canAddMore = value.length < maxPhotos;

  return (
    <div className="flex flex-wrap gap-2 items-start">
      {/* Hidden file input — accept image, capture=environment for mobile rear camera */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Existing photos */}
      {value.map((url, idx) => (
        <div
          key={`${url}-${idx}`}
          className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100 flex-shrink-0"
        >
          <img
            src={url}
            alt={`Photo ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {/* Photo number badge */}
          <span className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[8px] font-bold rounded px-1">
            {idx + 1}/{maxPhotos}
          </span>
        </div>
      ))}

      {/* Add photo button */}
      {canAddMore && (
        <button
          type="button"
          onClick={handleTrigger}
          disabled={disabled || uploading}
          className="flex w-16 h-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:text-brand-teal hover:border-brand-teal hover:bg-brand-teal/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-brand-teal" />
          ) : value.length === 0 ? (
            <Camera className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span className="text-[8px] text-center font-medium mt-0.5 leading-tight px-0.5">
            {uploading
              ? 'อัปโหลด...'
              : value.length === 0
              ? placeholder
              : `${value.length}/${maxPhotos}`}
          </span>
        </button>
      )}
    </div>
  );
}
