import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import {
  MAX_FILE_SIZE, ALLOWED_TYPES,
  validateMagicBytes, sanitizeFolderPath,
  generateFileName, uploadToS3,
} from '@/modules/upload/service';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = (formData.get('folder') as string) || 'uploads';

    // Validate folder path
    const folder = sanitizeFolderPath(rawFolder);
    if (!folder) return NextResponse.json({ error: 'Invalid folder path' }, { status: 400 });
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ไฟล์มีขนาดเกิน ${MAX_FILE_SIZE / 1024 / 1024} MB กรุณาลดขนาดรูปแล้วลองใหม่` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'ไฟล์ไม่ใช่ประเภทที่รองรับ กรุณาอัปโหลดไฟล์ JPEG, PNG, WebP หรือ PDF' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes
    if (!validateMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'เนื้อหาไฟล์ไม่ตรงกับประเภทที่อนุญาต กรุณาอัปโหลดไฟล์ที่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Upload
    const fileName = generateFileName(folder, file.name);
    const fileUrl = await uploadToS3(buffer, fileName, file.type);

    return NextResponse.json({ fileUrl, fileName: file.name, fileSize: file.size });
  } catch (error: any) {
    console.error('Error during S3 file upload:', error);
    return safeErrorResponse(error);
  }
}
