import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getCoordsFilePath(modelCode: string | null): string {
  const code = (modelCode || 'AION_V').toUpperCase();
  const isYp = code === 'AION_YP' || code === 'AION_YP5' || code === 'AION_ES';
  const isHt = code === 'HYPTEC_HT' || code === 'HYPTEC_HT8';
  const isUt = code === 'AION_UT';
  const filename = isUt
    ? 'aion-ut-coordinates.json'
    : isHt 
      ? 'hyptec-ht-coordinates.json' 
      : isYp 
        ? 'aion-yp-coordinates.json' 
        : 'aion-v-coordinates.json';
  return path.join(process.cwd(), 'public', 'templates', filename);
}

// GET: Read current coordinates
export async function GET(req: NextRequest) {
  try {
    const modelCode = req.nextUrl.searchParams.get('modelCode');
    const filePath = getCoordsFilePath(modelCode);
    
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return NextResponse.json(data);
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}

// POST: Save new coordinates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const modelCode = body.modelCode || req.nextUrl.searchParams.get('modelCode');
    const filePath = getCoordsFilePath(modelCode);
    
    // Remove modelCode from body to avoid saving it in coordinates file
    const { modelCode: _, ...coordsOnly } = body;

    fs.writeFileSync(filePath, JSON.stringify(coordsOnly, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'บันทึกพิกัดเรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
