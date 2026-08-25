import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// ──────────────────────────────────────
// S3 Client Singleton
// ──────────────────────────────────────
export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

// ──────────────────────────────────────
// Constants
// ──────────────────────────────────────
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'image/heic', 'image/heif', 'application/pdf',
];

// Magic bytes signatures for standard file types validation
const MAGIC_SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];

// ──────────────────────────────────────
// Validation Helpers
// ──────────────────────────────────────
export function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // 1. Check standard types (jpeg, png, webp, pdf)
  const isStandard = MAGIC_SIGNATURES.some(sig => {
    const offset = sig.offset || 0;
    return sig.bytes.every((byte, i) => buffer[offset + i] === byte);
  });
  if (isStandard) return true;

  // 2. Check HEIC/HEIF box container (must start with "ftyp" at offset 4, then have allowed brands at offset 8)
  const isFtyp = buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
  if (isFtyp) {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    const allowedHeicBrands = ['heic', 'heix', 'hevc', 'heim', 'heis', 'hevd', 'hevm', 'hevs', 'mif1', 'msf1'];
    return allowedHeicBrands.includes(brand);
  }

  return false;
}

export function sanitizeFolderPath(rawFolder: string): string | null {
  let folder = rawFolder;
  let prev = '';
  while (prev !== folder) {
    prev = folder;
    folder = folder.replace(/\.\./g, '');
  }
  folder = folder.replace(/^\/+/, '').replace(/\/+$/g, '');

  if (!/^[a-zA-Z0-9_\-\/]+$/.test(folder)) return null;
  if (folder.split('/').length > 6) return null;
  return folder;
}

// ──────────────────────────────────────
// Upload to S3
// ──────────────────────────────────────
export async function uploadToS3(buffer: Buffer, fileName: string, contentType: string) {
  const bucketName = process.env.S3_BUCKET || 'space-itake-dev';
  const disableAcl = process.env.S3_DISABLE_ACL === 'true';

  const uploadParams: any = {
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  };

  // Only apply ACL if not disabled in settings (some buckets block public ACLs)
  if (!disableAcl) {
    uploadParams.ACL = 'public-read';
  }

  await s3.send(new PutObjectCommand(uploadParams));

  const cleanEndpoint = process.env.S3_ENDPOINT?.replace('https://', '') || 'sgp1.digitaloceanspaces.com';
  return `https://${bucketName}.${cleanEndpoint}/${fileName}`;
}

export function generateFileName(folder: string, originalName: string, contentType?: string): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const timestamp = Date.now();

  const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
  };

  let ext = contentType ? (MIME_TO_EXT[contentType.toLowerCase()] || '') : '';
  if (!ext) {
    ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  }
  
  let safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\.[^.]+$/, '');
  // If originalName contains only non-alphanumeric characters (e.g. Thai characters), fallback to attachment with random string
  if (/^_*$/.test(safeName)) {
    safeName = `attachment_${crypto.randomBytes(4).toString('hex')}`;
  }

  const isSpecificFolder = folder.split('/').length > 2 || folder.includes('signature');

  return isSpecificFolder
    ? `${folder}/${timestamp}_${safeName}.${ext}`
    : `${folder}/${yearMonth}/${timestamp}_${safeName}.${ext}`;
}
