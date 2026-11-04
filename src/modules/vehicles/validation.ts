import { prisma } from '@/lib/prisma';
import { ModelCode, MODEL_NAMES } from '@/types/pdi';
import type { ValidatedImportVehicle } from './service';

const VALID_MODEL_CODES = new Set([
  'AION_V', 'AION_V5', 'AION_UT', 'AION_YP', 'AION_YP5',
  'AION_ES', 'HYPTEC_HT', 'HYPTEC_HT8', 'HYPTEC_SSR', 'GAC_M8',
]);

export interface ImportValidationResult {
  validated: ValidatedImportVehicle[];
  errors: string[];
}

export async function validateImportBatch(
  vehicles: any[],
  userBranchId?: string
): Promise<ImportValidationResult> {
  // 1. Fetch branches for mapping branchCode -> branchId
  const branches = await prisma.branch.findMany();
  const branchMap = new Map(branches.map(b => [b.code.toUpperCase(), b.id]));

  // 2. Check existing VINs (only batch VINs, not all DB)
  const batchVinCandidates = vehicles.filter(v => v.vin).map(v => String(v.vin).trim().toUpperCase());
  const existingInDb = batchVinCandidates.length > 0
    ? await prisma.vehicle.findMany({ where: { vin: { in: batchVinCandidates } }, select: { vin: true } })
    : [];
  const existingVins = new Set(existingInDb.map(v => v.vin.toUpperCase()));

  const errors: string[] = [];
  const validated: ValidatedImportVehicle[] = [];
  const batchVins = new Set<string>();

  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    const rowNum = i + 1;

    // VIN
    if (!v.vin) { errors.push(`แถวที่ ${rowNum}: ไม่มีเลขตัวถัง (VIN)`); continue; }
    const rawVin = String(v.vin).trim().toUpperCase();
    if (rawVin.length < 5) { errors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${v.vin}" สั้นเกินไป`); continue; }
    if (existingVins.has(rawVin)) { errors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${v.vin}" มีอยู่ในระบบสต็อกแล้ว`); continue; }
    if (batchVins.has(rawVin)) { errors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${v.vin}" ซ้ำกับรายการอื่นในไฟล์ที่อัปโหลด`); continue; }
    batchVins.add(rawVin);

    // Motor Battery Number
    if (!v.motorBatteryNumber || !String(v.motorBatteryNumber).trim()) {
      errors.push(`แถวที่ ${rowNum}: ไม่มีเลขมอเตอร์แบตเตอรี่ (motorBatteryNumber)`);
      continue;
    }

    // Model
    if (!v.modelCode) { errors.push(`แถวที่ ${rowNum}: ไม่มีรหัสรุ่นรถ (modelCode)`); continue; }
    const mCode = String(v.modelCode).trim();
    if (!VALID_MODEL_CODES.has(mCode)) {
      errors.push(`แถวที่ ${rowNum}: รหัสรุ่นรถ "${v.modelCode}" ไม่ถูกต้อง`);
      continue;
    }

    // Exterior Color
    if (!v.colorName || !String(v.colorName).trim()) { errors.push(`แถวที่ ${rowNum}: ไม่มีสีภายนอกรถ (colorName)`); continue; }

    // Interior Color
    if (!v.interiorColor || !String(v.interiorColor).trim()) { errors.push(`แถวที่ ${rowNum}: ไม่มีสีภายในรถ (interiorColor)`); continue; }

    // Production Year
    if (!v.productionYear) { errors.push(`แถวที่ ${rowNum}: ไม่มีปีที่ผลิตรถ (productionYear)`); continue; }
    const prodYear = parseInt(String(v.productionYear).trim());
    if (isNaN(prodYear)) {
      errors.push(`แถวที่ ${rowNum}: ปีที่ผลิตรถ "${v.productionYear}" ไม่ถูกต้อง`);
      continue;
    }

    // Lot Number
    if (!v.lotNumber || !String(v.lotNumber).trim()) { errors.push(`แถวที่ ${rowNum}: ไม่มีเลขล็อต/เลขล็อค (lotNumber)`); continue; }

    // Branch
    if (!v.branchCode) { errors.push(`แถวที่ ${rowNum}: ไม่มีรหัสสาขา (branchCode)`); continue; }
    const bCode = String(v.branchCode).trim().toUpperCase();
    const branchId = branchMap.get(bCode);
    if (!branchId) { errors.push(`แถวที่ ${rowNum}: รหัสสาขา "${v.branchCode}" ไม่มีอยู่ในระบบ`); continue; }
    if (userBranchId && branchId !== userBranchId) {
      errors.push(`แถวที่ ${rowNum}: คุณไม่มีสิทธิ์นำเข้ารถยนต์เข้าสาขาอื่น`);
      continue;
    }

    validated.push({
      vin: rawVin,
      modelCode: mCode as ModelCode,
      modelName: MODEL_NAMES[mCode as ModelCode],
      colorName: String(v.colorName).trim(),
      interiorColor: String(v.interiorColor).trim(),
      productionYear: prodYear,
      branchId,
      warehouse: v.warehouse ? String(v.warehouse).trim() : null,
      floorplan: v.floorplan ? String(v.floorplan).trim() : null,
      lotNumber: String(v.lotNumber).trim(),
      motorBatteryNumber: String(v.motorBatteryNumber).trim(),
    });
  }

  return { validated, errors };
}
