import { NextRequest, NextResponse } from 'next/server';
import { PdiType } from '@prisma/client';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { getChecklistTemplate, VALID_PDI_TYPES } from '@/modules/checklist/service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ modelCode: string }> }
) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  try {
    const { modelCode } = await params;
    const typeParam = req.nextUrl.searchParams.get('type') ?? 'INCOMING';

    if (!VALID_PDI_TYPES.has(typeParam as PdiType)) {
      return NextResponse.json({ error: `Invalid PDI type: ${typeParam}` }, { status: 400 });
    }

    const template = await getChecklistTemplate(modelCode, typeParam as PdiType);
    if (!template) {
      return NextResponse.json({ error: `Template not found for model ${modelCode} and PDI type ${typeParam}` }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error fetching checklist template:', error);
    return safeErrorResponse(error);
  }
}
