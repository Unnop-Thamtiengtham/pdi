import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

// Initialize S3 client for DigitalOcean Spaces (S3-compatible API)
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ไฟล์มีขนาดเกิน ${MAX_FILE_SIZE / 1024 / 1024} MB กรุณาลดขนาดรูปแล้วลองใหม่` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'ไฟล์ไม่ใช่รูปภาพ กรุณาอัปโหลดไฟล์ JPEG, PNG, หรือ WebP' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with folder structure
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\.[^.]+$/, '');
    
    // If the folder already contains a job ID or is for signatures, we don't need year-month subfolders
    const isSpecificFolder = folder.split('/').length > 2 || folder.includes('signature');
    
    const fileName = isSpecificFolder
      ? `${folder}/${timestamp}_${safeName}.${ext}`
      : `${folder}/${yearMonth}/${timestamp}_${safeName}.${ext}`;

    // Upload to S3
    const bucketName = process.env.S3_BUCKET || 'space-itake-dev';
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      })
    );

    // Construct public URL
    const cleanEndpoint = process.env.S3_ENDPOINT?.replace('https://', '') || 'sgp1.digitaloceanspaces.com';
    const fileUrl = `https://${bucketName}.${cleanEndpoint}/${fileName}`;

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Error during S3 file upload:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
