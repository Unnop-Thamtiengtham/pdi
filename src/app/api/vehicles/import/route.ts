import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ModelCode, MODEL_NAMES } from '@/types/pdi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicles } = body;

    if (!vehicles || !Array.isArray(vehicles)) {
      return NextResponse.json({ error: 'Invalid payload. "vehicles" must be an array.' }, { status: 400 });
    }

    if (vehicles.length === 0) {
      return NextResponse.json({ error: 'No vehicles provided.' }, { status: 400 });
    }

    // 1. Fetch branches for mapping branchCode -> branchId
    const branches = await prisma.branch.findMany();
    const branchMap = new Map(branches.map(b => [b.code.toUpperCase(), b.id]));

    // 2. Fetch existing VINs to check for database duplicates
    const allExistingVehicles = await prisma.vehicle.findMany({
      select: { vin: true }
    });
    const existingVins = new Set(allExistingVehicles.map(v => v.vin.toUpperCase()));

    const errors: string[] = [];
    const validatedVehicles: any[] = [];
    const batchVins = new Set<string>();

    const validModelCodes = new Set([
      'AION_V',
      'AION_V5',
      'AION_UT',
      'AION_YP',
      'AION_YP5',
      'AION_ES',
      'HYPTEC_HT',
      'HYPTEC_HT8',
      'HYPTEC_SSR',
      'GAC_M8'
    ]);

    // 3. Validation loop
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const rowNum = i + 1;

      // VIN Check
      if (!v.vin) {
        errors.push(`แถวที่ ${rowNum}: ไม่มีเลขตัวถัง (VIN)`);
        continue;
      }
      const rawVin = String(v.vin).trim().toUpperCase();
      if (rawVin.length < 5) {
        errors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${v.vin}" สั้นเกินไป`);
        continue;
      }
      if (existingVins.has(rawVin)) {
        errors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${v.vin}" มีอยู่ในระบบสต็อกแล้ว`);
        continue;
      }
      if (batchVins.has(rawVin)) {
        errors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${v.vin}" ซ้ำกับรายการอื่นในไฟล์ที่อัปโหลด`);
        continue;
      }
      batchVins.add(rawVin);

      // Model Check
      if (!v.modelCode) {
        errors.push(`แถวที่ ${rowNum}: ไม่มีรหัสรุ่นรถ (modelCode)`);
        continue;
      }
      const mCode = String(v.modelCode).trim();
      if (!validModelCodes.has(mCode)) {
        errors.push(`แถวที่ ${rowNum}: รหัสรุ่นรถ "${v.modelCode}" ไม่ถูกต้อง (เลือกได้เฉพาะ: AION_V, AION_V5, AION_UT, AION_YP, AION_YP5, AION_ES, HYPTEC_HT, HYPTEC_HT8, HYPTEC_SSR, GAC_M8)`);
        continue;
      }

      // Color Check
      if (!v.colorName) {
        errors.push(`แถวที่ ${rowNum}: ไม่มีสีหลักภายนอก (colorName)`);
        continue;
      }

      // Branch Check
      if (!v.branchCode) {
        errors.push(`แถวที่ ${rowNum}: ไม่มีรหัสสาขา (branchCode)`);
        continue;
      }
      const bCode = String(v.branchCode).trim().toUpperCase();
      const branchId = branchMap.get(bCode);
      if (!branchId) {
        errors.push(`แถวที่ ${rowNum}: รหัสสาขา "${v.branchCode}" ไม่มีอยู่ในระบบ (รหัสสาขาที่มี: MBR, RCD)`);
        continue;
      }

      // wsDate Check
      if (!v.wsDate) {
        errors.push(`แถวที่ ${rowNum}: ไม่มีวันที่ขายส่งดีลเลอร์ (wsDate)`);
        continue;
      }
      const parsedWsDate = new Date(v.wsDate);
      if (isNaN(parsedWsDate.getTime())) {
        errors.push(`แถวที่ ${rowNum}: วันที่ wsDate "${v.wsDate}" รูปแบบไม่ถูกต้อง (ควรเป็นปี-เดือน-วัน เช่น 2026-06-23)`);
        continue;
      }

      // Parse productionYear if provided
      let prodYear: number | null = null;
      if (v.productionYear) {
        const py = parseInt(v.productionYear);
        if (!isNaN(py)) {
          prodYear = py;
        }
      }

      validatedVehicles.push({
        vin: rawVin,
        modelCode: mCode as ModelCode,
        modelName: MODEL_NAMES[mCode as ModelCode],
        colorName: String(v.colorName).trim(),
        exteriorColor: v.exteriorColor ? String(v.exteriorColor).trim() : null,
        interiorColor: v.interiorColor ? String(v.interiorColor).trim() : null,
        productionYear: prodYear,
        wsDate: parsedWsDate,
        branchId,
        warehouse: v.warehouse ? String(v.warehouse).trim() : null,
        floorplan: v.floorplan ? String(v.floorplan).trim() : null,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // 4. Database Transaction for bulk creation
    const createdVehicles = await prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (let i = 0; i < validatedVehicles.length; i++) {
        const item = validatedVehicles[i];
        const arrivedAt = new Date();
        const incomingDeadline = arrivedAt; // SLA timer starts when Incoming PDI starts manually

        // Create Vehicle
        const vehicle = await tx.vehicle.create({
          data: {
            vin: item.vin,
            modelCode: item.modelCode,
            modelName: item.modelName,
            colorName: item.colorName,
            exteriorColor: item.exteriorColor,
            interiorColor: item.interiorColor,
            productionYear: item.productionYear,
            wsDate: item.wsDate,
            branchId: item.branchId,
            warehouse: item.warehouse,
            floorplan: item.floorplan,
            arrivedAt,
            incomingDeadline,
            currentStatus: 'IN_STOCK',
          },
        });

        results.push(vehicle);
      }
      return results;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdVehicles.length} vehicles.`,
      count: createdVehicles.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error importing vehicles:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
