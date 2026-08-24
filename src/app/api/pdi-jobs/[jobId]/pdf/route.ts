import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// ── COORDINATE MAPPING FOR AION V / V5 ──────────────────
// Page size: 595.32 x 841.92 (standard A4)
// Y=0 is bottom of page, Y=842 is top
// Coordinates are loaded from the JSON file saved by the PDF Picker tool.
// If no saved file exists, hardcoded defaults are used.
function loadSavedCoordinates(modelCode: string): { metadata?: any; checklist?: any; battery?: any } {
  try {
    const isYp = modelCode === 'AION_YP' || modelCode === 'AION_YP5';
    const isHt = modelCode === 'HYPTEC_HT' || modelCode === 'HYPTEC_HT8';
    const filename = isHt 
      ? 'hyptec-ht-coordinates.json' 
      : isYp 
        ? 'aion-yp-coordinates.json' 
        : 'aion-v-coordinates.json';
    const filePath = path.join(process.cwd(), 'public', 'templates', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return {};
}

const DEFAULT_COORDINATES = {
  metadata: {
    modelName: { x: 100, y: 759 },
    vin: { x: 238, y: 755 },
    motorNumber: { x: 440, y: 755 },
    deliveryDate: { x: 530, y: 755 },
    salesName: { x: 90, y: 742 },
    colorName: { x: 245, y: 742 },
    arrivedAt: { x: 440, y: 742 },
    completedAt: { x: 530, y: 742 },
    jobNumber: { x: 498, y: 770 },
  },
  checklist: {
    // ─── LEFT COLUMN (checkbox X ≈ 163) ───

    // 1. ลักษณะภายนอกและสี — row spacing ~12.5pt, starts Y≈688
    EXT_001: { x: 163, y: 688 }, // ประตู
    EXT_002: { x: 163, y: 675 }, // ฝากระโปรงหน้า/หลัง
    EXT_003: { x: 163, y: 663 }, // กันชนหน้า/หลัง
    EXT_004: { x: 163, y: 650 }, // แก้มบังโคลน
    EXT_005: { x: 163, y: 638 }, // กระจกมองข้าง
    EXT_006: { x: 163, y: 625 }, // อุปกรณ์ภายใน

    // 2. ไฟส่องสว่าง — starts Y≈590
    LGT_001: { x: 163, y: 590 }, // ไฟหน้า
    LGT_002: { x: 163, y: 577 }, // ไฟท้าย
    LGT_003: { x: 163, y: 564 }, // ไฟเลี้ยว
    LGT_004: { x: 163, y: 551 }, // ไฟส่องสว่างในเวลากลางวัน
    LGT_005: { x: 163, y: 538 }, // กลางวัน
    LGT_006: { x: 163, y: 525 }, // ไฟส่องป้ายทะเบียน
    LGT_007: { x: 163, y: 512 }, // ไฟถอยหลัง
    LGT_008: { x: 163, y: 499 }, // ไฟตัดหมอก
    LGT_009: { x: 163, y: 486 }, // ไฟอ่านหนังสือ
    LGT_010: { x: 163, y: 473 }, // ไฟภายในห้องโดยสาร

    // ─── RIGHT COLUMN (checkbox X ≈ 557) ───

    // 3. กระจกและที่ปัดน้ำฝน — starts Y≈688
    GLS_001: { x: 557, y: 688 }, // ฟังก์ชันป้องกันการหนีบ
    GLS_002: { x: 557, y: 675 }, // ฟังก์ชันปรับกระจกขึ้น/ลง
    GLS_003: { x: 557, y: 663 }, // ฟังก์ชันล้างกระจก/ที่ปัดน้ำฝน
    GLS_004: { x: 557, y: 650 }, // ฟังก์ชันล้างกระจก/ที่ปัด
    GLS_005: { x: 557, y: 638 }, // น้ำฝน / ฟังก์ชัน

    // 4. ระบบปรับอากาศ — starts Y≈600
    AC_001: { x: 557, y: 600 }, // ฟังก์ชันทำความเย็น/ทำความร้อน
    AC_002: { x: 557, y: 587 }, // ร้อน
    AC_003: { x: 557, y: 574 }, // การปรับความแรงลม/ทิศทาง

    // 5. ระบบเครื่องเสียง — starts Y≈540
    ENT_001: { x: 557, y: 540 }, // กล้องมองภาพรอบทิศทาง
    ENT_002: { x: 557, y: 527 }, // ระบบเสียง/ไฮ
    ENT_003: { x: 557, y: 514 }, // ฟังก์ชันอินเทอร์เน็ต
    ENT_004: { x: 557, y: 501 }, // ระบบสั่งการด้วยเสียง
    ENT_005: { x: 557, y: 488 }, // ฟังก์ชันบลูทูธ
    ENT_006: { x: 557, y: 475 }, // ฟังก์ชันการนำทาง
    ENT_007: { x: 557, y: 462 }, // ฟังก์ชันความบันเทิง

    // ─── BOTTOM 4-COLUMN SECTION ───

    // 6. การตรวจสอบระดับของเหลว (X≈163)
    FLD_001: { x: 163, y: 388 }, // น้ำยาหล่อเย็น
    FLD_002: { x: 163, y: 375 }, // น้ำมันเบรก
    FLD_003: { x: 163, y: 362 }, // น้ำยาทำความสะอาดกระจก

    // 7. ระบบช่วงล่าง (X≈262)
    CHS_001: { x: 262, y: 388 }, // ลักษณะภายนอก
    CHS_002: { x: 262, y: 375 }, // แบตเตอรี่ HV
    CHS_003: { x: 262, y: 362 }, // ท่อและการเชื่อมต่อของท่อ
    CHS_004: { x: 262, y: 349 }, // ยางท่อ

    // 8. การเบรกและการบังคับเลี้ยว (X≈397)
    BRK_001: { x: 397, y: 388 }, // ฟังก์ชันเบรก
    BRK_002: { x: 397, y: 375 }, // ฟังก์ชันบังคับเลี้ยว
    BRK_003: { x: 397, y: 362 }, // ประสิทธิภาพการขับขี่
    BRK_004: { x: 397, y: 349 }, // ขับขี่

    // 9. การปลดล็อกช่องชาร์จ (X≈557)
    CHG_001: { x: 557, y: 388 }, // ปุ่มบนรีโมทกุญแจ
    CHG_002: { x: 557, y: 375 }, // ปุ่มบนหน้าจอ
    CHG_003: { x: 557, y: 362 }, // กลาง
    CHG_004: { x: 557, y: 349 }, // ปุ่มฝาปิดช่องชาร์จ
  } as Record<string, { x: number, y: number }>,
  battery: {
    // ค่าตัวเลข (ใช้ drawText)
    mainVoltage: { x: 130, y: 272 },
    secVoltage: { x: 195, y: 272 },
    mainSoh: { x: 130, y: 258 },
    secSoh: { x: 195, y: 258 },
    mainSoc: { x: 130, y: 244 },
    mainCca: { x: 130, y: 230 },
    tirePressure: { x: 195, y: 230 },
    // ช่องติ๊ก (ใช้ drawVectorCheck)
    instrumentNormal: { x: 365, y: 272 },
    instrumentWarning: { x: 365, y: 258 },
    diagErase: { x: 525, y: 272 },
    diagOta: { x: 525, y: 258 },
  },
  defects: {
    row1Y: 175,
    row2Y: 162,
    row3Y: 149,
    colCode: 155,
    colDesc: 260,
    colAction: 435,
  },
  signatures: {
    inspector: { x: 120, y: 100 },
    customer: { x: 400, y: 100 },
    inspectorName: { x: 120, y: 90 },
    customerName: { x: 400, y: 90 },
    inspectorDate: { x: 220, y: 90 },
    customerDate: { x: 500, y: 90 },
  }
};

// Merge: saved coordinates override defaults
function getCoordinates(modelCode: string) {
  const saved = loadSavedCoordinates(modelCode);
  return {
    metadata: { ...DEFAULT_COORDINATES.metadata, ...(saved.metadata || {}) },
    checklist: { ...DEFAULT_COORDINATES.checklist, ...(saved.checklist || {}) } as Record<string, { x: number, y: number }>,
    battery: { ...DEFAULT_COORDINATES.battery, ...(saved.battery || {}) },
    defects: DEFAULT_COORDINATES.defects,
    signatures: DEFAULT_COORDINATES.signatures,
  };
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await props.params;

  try {
    // 1. Fetch Job from database
    const job = await prisma.pdiJob.findUnique({
      where: { id: jobId },
      include: {
        vehicle: true,
        checklistItems: {
          include: {
            item: true
          }
        },
        defects: true,
        inspector: true,
        batteryTest: true,
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลใบงานนี้ในระบบ' }, { status: 404 });
    }

    const modelCode = job.vehicle?.modelCode || 'AION_V';
    
    // Load coordinates (from saved JSON or defaults)
    const COORDINATES = getCoordinates(modelCode);

    const isSupported = ['AION_V', 'AION_V5', 'AION_YP', 'AION_YP5', 'AION_UT', 'HYPTEC_HT', 'HYPTEC_HT8'].includes(modelCode);

    if (!isSupported) {
      return NextResponse.json({ 
        error: `ระบบการพิมพ์ทับ PDF ยังไม่รองรับรุ่นรถของคุณ (รุ่นของคุณคือ: ${modelCode})` 
      }, { status: 400 });
    }

    // 2. Resolve Template & Font Paths
    const isYp = modelCode === 'AION_YP' || modelCode === 'AION_YP5';
    const isHt = modelCode === 'HYPTEC_HT' || modelCode === 'HYPTEC_HT8';
    const isUt = modelCode === 'AION_UT';
    const templateName = isUt
      ? 'aion-ut-pdi.pdf'
      : isHt 
        ? 'hyptec-ht-pdi.pdf' 
        : isYp 
          ? 'aion-yp-pdi.pdf' 
          : 'aion-v-pdi.pdf';
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew.ttf');

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        error: `ยังไม่ได้ติดตั้งแบบฟอร์ม PDF ต้นฉบับ สำหรับรุ่น ${modelCode} (${templateName})` 
      }, { status: 500 });
    }

    if (!fs.existsSync(fontPath)) {
      return NextResponse.json({ 
        error: 'ยังไม่ได้ติดตั้งฟอนต์ภาษาไทยสำหรับไฟล์ PDF' 
      }, { status: 500 });
    }

    // 3. Load PDF template
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    pdfDoc.registerFontkit(fontkit);
    const thaiFontBytes = fs.readFileSync(fontPath);
    const thaiFont = await pdfDoc.embedFont(thaiFontBytes);

    const page = pdfDoc.getPages()[0];

    // ── Vector drawing helpers ──
    const drawVectorCheck = (x: number, y: number) => {
      page.drawLine({
        start: { x: x + 1, y: y + 4 },
        end: { x: x + 4, y: y + 1 },
        thickness: 1.5,
        color: rgb(0, 0, 0),
      });
      page.drawLine({
        start: { x: x + 4, y: y + 1 },
        end: { x: x + 9, y: y + 8 },
        thickness: 1.5,
        color: rgb(0, 0, 0),
      });
    };

    const drawVectorCross = (x: number, y: number) => {
      page.drawLine({
        start: { x: x + 1, y: y + 1 },
        end: { x: x + 9, y: y + 9 },
        thickness: 1.5,
        color: rgb(0.85, 0.1, 0.1),
      });
      page.drawLine({
        start: { x: x + 1, y: y + 9 },
        end: { x: x + 9, y: y + 1 },
        thickness: 1.5,
        color: rgb(0.85, 0.1, 0.1),
      });
    };

    const drawVectorCircle = (x: number, y: number) => {
      page.drawCircle({
        x: x + 5,
        y: y + 5,
        size: 4,
        borderWidth: 1.3,
        borderColor: rgb(0, 0, 0),
      });
    };

    // 4. Fill Metadata
    const meta = COORDINATES.metadata;
    const formatThaiDate = (date: Date | null) => 
      date ? new Date(date).toLocaleDateString('th-TH') : '-';

    page.drawText(job.jobNumber, { x: meta.jobNumber.x, y: meta.jobNumber.y, size: 7, font: thaiFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(job.vehicle?.modelName || 'AION V', { x: meta.modelName.x, y: meta.modelName.y, size: 8, font: thaiFont });
    page.drawText(job.vehicleVin, { x: meta.vin.x, y: meta.vin.y, size: 8, font: thaiFont });
    page.drawText(job.vehicle?.motorBatteryNumber || '-', { x: meta.motorNumber.x, y: meta.motorNumber.y, size: 7, font: thaiFont });
    page.drawText(formatThaiDate(job.targetDeliveryDate), { x: meta.deliveryDate.x, y: meta.deliveryDate.y, size: 7, font: thaiFont });
    page.drawText(job.salesName || job.inspector?.name || '-', { x: meta.salesName.x, y: meta.salesName.y, size: 8, font: thaiFont });
    page.drawText(job.vehicle?.colorName || job.vehicle?.exteriorColor || '-', { x: meta.colorName.x, y: meta.colorName.y, size: 8, font: thaiFont });
    page.drawText(formatThaiDate(job.vehicle?.arrivedAt), { x: meta.arrivedAt.x, y: meta.arrivedAt.y, size: 7, font: thaiFont });
    page.drawText(formatThaiDate(job.completedAt || new Date()), { x: meta.completedAt.x, y: meta.completedAt.y, size: 7, font: thaiFont });

    // 5. Fill Checklist items
    // Build maps: result + numeric values
    const resultsMap: Record<string, { result: string; numericValue?: number | null; numericValue2?: number | null; hasNumeric: boolean; numericUnit?: string | null }> = {};
    job.checklistItems.forEach((cr) => {
      resultsMap[cr.item.itemCode] = {
        result: cr.result,
        numericValue: cr.numericValue,
        numericValue2: cr.numericValue2,
        hasNumeric: cr.item.hasNumeric,
        numericUnit: cr.item.numericUnit,
      };
    });

    Object.entries(COORDINATES.checklist).forEach(([code, coords]) => {
      const info = resultsMap[code];
      if (!info) return;

      // If this item has numeric data, draw the value as text instead of a checkmark
      if (info.hasNumeric && info.numericValue !== null && info.numericValue !== undefined) {
        const unit = info.numericUnit || '';
        const text = `${info.numericValue}${unit}`;
        page.drawText(text, { x: coords.x, y: coords.y, size: 8, font: thaiFont, color: rgb(0, 0, 0) });
        return;
      }

      // Otherwise draw pass/fail/repaired checkmark
      if (info.result === 'PASS') {
        drawVectorCheck(coords.x, coords.y);
      } else if (info.result === 'FAIL') {
        drawVectorCross(coords.x, coords.y);
      } else if (info.result === 'REPAIRED') {
        drawVectorCircle(coords.x, coords.y);
      }
    });

    // 6. Fill Battery 12V test data
    const bat = job.batteryTest as any;
    if (bat) {
      const bCoords = COORDINATES.battery;
      const getValStr = (val: number | null | undefined, unit: string) => 
        val !== undefined && val !== null ? `${val} ${unit}` : '___';

      const isSingleBattery = isYp || modelCode === 'AION_UT';
      if (isSingleBattery) {
        // AION YP / YP5 / UT (Single battery with SOC/CCA)
        if (bCoords.mainVoltage) page.drawText(getValStr(bat.mainVoltage, 'V'), { x: bCoords.mainVoltage.x, y: bCoords.mainVoltage.y, size: 8, font: thaiFont });
        if (bCoords.mainSoh) page.drawText(getValStr(bat.mainSoh, '%'), { x: bCoords.mainSoh.x, y: bCoords.mainSoh.y, size: 8, font: thaiFont });
        if (bCoords.mainSoc) page.drawText(getValStr(bat.mainSoc, '%'), { x: bCoords.mainSoc.x, y: bCoords.mainSoc.y, size: 8, font: thaiFont });
        if (bCoords.mainCca) page.drawText(getValStr(bat.mainCca, 'A'), { x: bCoords.mainCca.x, y: bCoords.mainCca.y, size: 8, font: thaiFont });
        if (bCoords.tirePressure) page.drawText(getValStr(bat.tirePressure, 'psi'), { x: bCoords.tirePressure.x, y: bCoords.tirePressure.y, size: 8, font: thaiFont });
      } else {
        // AION V / V5 (Dual batteries)
        if (bCoords.mainVoltage) page.drawText(getValStr(bat.mainVoltage, 'V'), { x: bCoords.mainVoltage.x, y: bCoords.mainVoltage.y, size: 8, font: thaiFont });
        if (bCoords.secVoltage) page.drawText(getValStr(bat.secVoltage, 'V'), { x: bCoords.secVoltage.x, y: bCoords.secVoltage.y, size: 8, font: thaiFont });
        if (bCoords.mainSoh) page.drawText(getValStr(bat.mainSoh, '%'), { x: bCoords.mainSoh.x, y: bCoords.mainSoh.y, size: 8, font: thaiFont });
        if (bCoords.secSoh) page.drawText(getValStr(bat.secSoh, '%'), { x: bCoords.secSoh.x, y: bCoords.secSoh.y, size: 8, font: thaiFont });
        if (bCoords.tirePressure) page.drawText(getValStr(bat.tirePressure, 'psi'), { x: bCoords.tirePressure.x, y: bCoords.tirePressure.y, size: 8, font: thaiFont });

        // ช่องติ๊ก: ไฟเตือนหน้าปัด (AION V เฉพาะ)
        if (bat.terminalCheck === 'FAIL') {
          if (bCoords.instrumentWarning) drawVectorCheck(bCoords.instrumentWarning.x, bCoords.instrumentWarning.y);
        } else {
          if (bCoords.instrumentNormal) drawVectorCheck(bCoords.instrumentNormal.x, bCoords.instrumentNormal.y);
        }
        
        // ช่องติ๊ก: วินิจฉัย/OTA (AION V เฉพาะ)
        if (bCoords.diagErase) drawVectorCheck(bCoords.diagErase.x, bCoords.diagErase.y);
        if (bCoords.diagOta) drawVectorCheck(bCoords.diagOta.x, bCoords.diagOta.y);
      }
    }

    // 7. Nonconforming Defects table
    const def = COORDINATES.defects;
    for (let i = 0; i < 3; i++) {
      const defect = job.defects?.[i];
      if (defect) {
        const rowY = i === 0 ? def.row1Y : i === 1 ? def.row2Y : def.row3Y;
        page.drawText(defect.checklistItemCode || '-', { x: def.colCode, y: rowY, size: 7, font: thaiFont });
        page.drawText(defect.description || '', { x: def.colDesc, y: rowY, size: 7, font: thaiFont });
        
        const actionStr = defect.status === 'RESOLVED' || defect.status === 'CLOSED' 
          ? 'แก้ไขเรียบร้อยแล้ว' 
          : 'ส่งซ่อม/แก้ไข';
        page.drawText(actionStr, { x: def.colAction, y: rowY, size: 7, font: thaiFont });
      }
    }

    // 8. Draw Signatures
    const sig = COORDINATES.signatures;
    const embedBase64Signature = async (base64Data: string, x: number, y: number) => {
      try {
        const cleanBase64 = base64Data.split(',')[1] || base64Data;
        const sigBytes = Buffer.from(cleanBase64, 'base64');
        const sigImage = await pdfDoc.embedPng(sigBytes);
        page.drawImage(sigImage, { x, y, width: 55, height: 20 });
      } catch (err) {
        console.error('Failed to embed signature image:', err);
      }
    };

    if (job.inspectorSig) {
      await embedBase64Signature(job.inspectorSig, sig.inspector.x, sig.inspector.y);
      page.drawText(job.inspector?.name || '', { x: sig.inspectorName.x, y: sig.inspectorName.y - 12, size: 8, font: thaiFont });
      page.drawText(formatThaiDate(job.completedAt), { x: sig.inspectorDate.x, y: sig.inspectorDate.y, size: 7, font: thaiFont });
    }

    if (job.customerSig) {
      await embedBase64Signature(job.customerSig, sig.customer.x, sig.customer.y);
      page.drawText(job.customerName || '', { x: sig.customerName.x, y: sig.customerName.y - 12, size: 8, font: thaiFont });
      page.drawText(formatThaiDate(job.completedAt), { x: sig.customerDate.x, y: sig.customerDate.y, size: 7, font: thaiFont });
    }

    // 9. Save PDF and return as download stream
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=pdi_report_${job.vehicleVin}.pdf`,
      }
    });

  } catch (error: any) {
    console.error('PDF overlay generation error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบในการสร้าง PDF' }, { status: 500 });
  }
}
