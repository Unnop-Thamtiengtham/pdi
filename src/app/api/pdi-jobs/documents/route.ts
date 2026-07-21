import { NextRequest, NextResponse } from 'next/server';
import { DocumentType } from '@prisma/client';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { saveDocument, deleteDocument } from '@/modules/documents/service';

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { jobId, docType, fileName, fileUrl, fileSize } = body;

    if (!jobId || !docType || !fileName || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields: jobId, docType, fileName, fileUrl' }, { status: 400 });
    }
    if (!Object.values(DocumentType).includes(docType as DocumentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const result = await saveDocument(
      jobId, docType as DocumentType, fileName, fileUrl,
      fileSize ? parseInt(fileSize) : null,
      session.user?.id || null
    );
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error saving job document:', error);
    return safeErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  try {
    const jobId = new URL(req.url).searchParams.get('jobId');
    const docType = new URL(req.url).searchParams.get('docType');

    if (!jobId || !docType) {
      return NextResponse.json({ error: 'Missing required query parameters: jobId, docType' }, { status: 400 });
    }

    const result = await deleteDocument(jobId, docType as DocumentType);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error deleting job document:', error);
    return safeErrorResponse(error);
  }
}
