import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PdiType } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ modelCode: string }> }
) {
  try {
    const { modelCode } = await params;
    const typeParam = req.nextUrl.searchParams.get('type') ?? 'INCOMING';

    const pdiType = typeParam as PdiType;

    const template = await prisma.checklistTemplate.findFirst({
      where: {
        modelCode,
        pdiType,
        isActive: true,
      },
      include: {
        items: {
          orderBy: [
            { categoryOrder: 'asc' },
            { itemOrder: 'asc' },
          ],
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: `Template not found for model ${modelCode} and PDI type ${pdiType}` }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error fetching checklist template:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
