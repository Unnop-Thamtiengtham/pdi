import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

// Magic bytes signatures for file type validation
const MAGIC_SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { type: 'image/heic', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { type: 'image/heif', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

// ──────────────────────────────────────
// Validation Helpers
// ──────────────────────────────────────
export function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  return MAGIC_SIGNATURES.some(sig => {
    const offset = sig.offset || 0;
    return sig.bytes.every((byte, i) => buffer[offset + i] === byte);
  });
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

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  const cleanEndpoint = process.env.S3_ENDPOINT?.replace('https://', '') || 'sgp1.digitaloceanspaces.com';
  return `https://${bucketName}.${cleanEndpoint}/${fileName}`;
}

export function generateFileName(folder: string, originalName: string): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const timestamp = Date.now();
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\.[^.]+$/, '');

  const isSpecificFolder = folder.split('/').length > 2 || folder.includes('signature');

  return isSpecificFolder
    ? `${folder}/${timestamp}_${safeName}.${ext}`
    : `${folder}/${yearMonth}/${timestamp}_${safeName}.${ext}`;
}
