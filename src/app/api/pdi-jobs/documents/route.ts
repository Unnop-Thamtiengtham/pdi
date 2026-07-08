import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { jobId, docType, fileName, fileUrl, fileSize } = body;

    if (!jobId || !docType || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, docType, fileName, fileUrl' },
        { status: 400 }
      );
    }

    // Verify document type is valid
    if (!Object.values(DocumentType).includes(docType as DocumentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Check if job exists
    const job = await prisma.pdiJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const uploadedBy = session?.user?.id || null;

    // Check if document of this type already exists for the job
    const existingDoc = await prisma.jobDocument.findFirst({
      where: {
        jobId,
        docType: docType as DocumentType,
      },
    });

    let doc;
    if (existingDoc) {
      doc = await prisma.jobDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileName,
          fileUrl,
          fileSize: fileSize ? parseInt(fileSize) : null,
          uploadedBy,
          uploadedAt: new Date(),
        },
      });
    } else {
      doc = await prisma.jobDocument.create({
        data: {
          jobId,
          docType: docType as DocumentType,
          fileName,
          fileUrl,
          fileSize: fileSize ? parseInt(fileSize) : null,
          uploadedBy,
        },
      });
    }

    return NextResponse.json(doc);
  } catch (error: any) {
    console.error('Error saving job document:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const docType = searchParams.get('docType');

    if (!jobId || !docType) {
      return NextResponse.json(
        { error: 'Missing required query parameters: jobId, docType' },
        { status: 400 }
      );
    }

    // Find and delete the document
    const doc = await prisma.jobDocument.findFirst({
      where: {
        jobId,
        docType: docType as DocumentType,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.jobDocument.delete({
      where: { id: doc.id },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting job document:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
