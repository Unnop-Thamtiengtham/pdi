'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function PhotoUpload({
  value,
  onChange,
  placeholder = 'อัปโหลดรูปภาพ',
  disabled = false,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      onChange(data.fileUrl);
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  const handleTriggerInput = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 group h-20 w-32 bg-slate-100 flex items-center justify-center">
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTriggerInput}
          disabled={disabled || uploading}
          className="flex h-20 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:border-brand-teal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-brand-teal" />
          ) : (
            <Camera className="w-5 h-5 mb-1" />
          )}
          <span className="text-[10px] text-center font-medium px-1">
            {uploading ? 'กำลังอัปโหลด...' : placeholder}
          </span>
        </button>
      )}
    </div>
  );
}
