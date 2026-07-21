import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
      onClick={onClose}
    >
      <button 
        type="button"
        className="absolute top-4 right-4 text-white hover:text-slate-300 bg-black/40 hover:bg-black/60 p-2 rounded-full transition-all shadow-md cursor-pointer"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt="ดูรูปตัวอย่าง" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200" 
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
    </div>
  );
}
