import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' น.';
}

/**
 * แปลง PdiType enum (เช่น "LONG_TERM") ให้เป็น route slug
 * ที่ตรงกับชื่อโฟลเดอร์ใน Next.js App Router
 */
const pdiTypeRouteMap: Record<string, string> = {
  INCOMING: 'incoming',
  LONG_TERM: 'longterm',
  PRE_DELIVERY: 'predelivery',
};

export function getPdiRouteSlug(pdiType: string): string {
  return pdiTypeRouteMap[pdiType] || pdiType.toLowerCase();
}

export function formatLocalDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
