import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

export async function saveDocument(
  jobId: string,
  docType: DocumentType,
  fileName: string,
  fileUrl: string,
  fileSize: number | null,
  uploadedBy: string | null
) {
  // Check if job exists
  const job = await prisma.pdiJob.findUnique({ where: { id: jobId } });
  if (!job) return { error: 'Job not found', status: 404 };

  // Check if document of this type already exists for the job
  const existingDoc = await prisma.jobDocument.findFirst({
    where: { jobId, docType },
  });

  if (existingDoc) {
    const doc = await prisma.jobDocument.update({
      where: { id: existingDoc.id },
      data: { fileName, fileUrl, fileSize, uploadedBy, uploadedAt: new Date() },
    });
    return { data: doc, status: 200 };
  }

  const doc = await prisma.jobDocument.create({
    data: { jobId, docType, fileName, fileUrl, fileSize, uploadedBy },
  });
  return { data: doc, status: 200 };
}

export async function deleteDocument(jobId: string, docType: DocumentType) {
  const doc = await prisma.jobDocument.findFirst({
    where: { jobId, docType },
  });

  if (!doc) return { error: 'Document not found', status: 404 };

  await prisma.jobDocument.delete({ where: { id: doc.id } });
  return { data: { success: true, message: 'Document deleted successfully' }, status: 200 };
}

export async function proxyDownload(targetUrl: string, allowedEndpoints: string[]) {
  const urlObj = new URL(targetUrl);
  const isAllowed = allowedEndpoints.some((endpoint) =>
    urlObj.hostname.includes(endpoint.replace('https://', '').replace('http://', ''))
  );

  if (!isAllowed) {
    console.warn('Blocked download proxy request to untrusted domain:', urlObj.hostname);
    return { error: 'Domain not allowed', status: 403 };
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote file: ${response.statusText}`);
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';

  return { data: blob, contentType, status: 200 };
}
