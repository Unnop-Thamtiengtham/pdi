import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch checklist items for a specific model (AION_V or AION_V5)
export async function GET(req: NextRequest) {
  const modelCode = req.nextUrl.searchParams.get('modelCode') || 'AION_V';

  try {
    // Find the active template for this model (INCOMING type)
    const template = await prisma.checklistTemplate.findFirst({
      where: {
        modelCode,
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
      return NextResponse.json({ error: `ไม่พบ Checklist Template สำหรับรุ่น ${modelCode}` }, { status: 404 });
    }

    // Group items by category
    const grouped: Record<string, { id: string; itemCode: string; itemName: string; category: string }[]> = {};
    template.items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push({
        id: item.itemCode,
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
      });
    });

    // Also add metadata fields and battery fields
    const metadataFields = [
      { id: 'meta_modelName', itemCode: 'meta_modelName', itemName: 'รุ่นรถ', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_vin', itemCode: 'meta_vin', itemName: 'VIN', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_motorNumber', itemCode: 'meta_motorNumber', itemName: 'หมายเลขมอเตอร์', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_deliveryDate', itemCode: 'meta_deliveryDate', itemName: 'วันที่รับรถ', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_salesName', itemCode: 'meta_salesName', itemName: 'ชื่อผู้จำหน่าย', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_colorName', itemCode: 'meta_colorName', itemName: 'สีตัวถัง', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_arrivedAt', itemCode: 'meta_arrivedAt', itemName: 'วันที่รับเข้าสต็อก', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_completedAt', itemCode: 'meta_completedAt', itemName: 'วันที่ตรวจสอบ', category: 'ข้อมูลรถ (Metadata)' },
      { id: 'meta_jobNumber', itemCode: 'meta_jobNumber', itemName: 'เลขใบงาน', category: 'ข้อมูลรถ (Metadata)' },
    ];

    return NextResponse.json({
      modelCode,
      templateId: template.id,
      fields: [
        ...metadataFields,
        ...template.items.map(item => ({
          id: item.itemCode,
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          hasNumeric: item.hasNumeric,
          numericUnit: item.numericUnit,
        })),
      ],
      grouped: {
        'ข้อมูลรถ (Metadata)': metadataFields,
        ...grouped,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch checklist fields:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
