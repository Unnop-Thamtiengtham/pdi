import { prisma } from '@/lib/prisma';
import { MODEL_NAMES, ModelCode } from '@/types/pdi';
import crypto from 'crypto';
import { generateJobNumber } from '@/modules/pdi-jobs/service';

// ──────────────────────────────────────
// GET — Single vehicle by VIN
// ──────────────────────────────────────
export async function getVehicleByVin(vin: string) {
  return prisma.vehicle.findUnique({
    where: { vin },
    include: {
      pdiJobs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          inspector: { select: { id: true, name: true, employeeId: true } },
          approver: { select: { id: true, name: true, employeeId: true } },
        },
      },
      branch: true,
    },
  });
}

// ──────────────────────────────────────
// GET — List vehicles with pagination
// ──────────────────────────────────────
export interface ListVehiclesParams {
  branchId?: string;
  page: number;
  limit: number;
}

export async function listVehicles(params: ListVehiclesParams, branchFilter?: string) {
  const whereClause: any = branchFilter
    ? { branchId: branchFilter }
    : params.branchId
      ? { branchId: params.branchId }
      : {};

  const skip = (params.page - 1) * params.limit;

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: whereClause,
      include: {
        pdiJobs: { orderBy: { createdAt: 'desc' }, take: 3 },
        branch: true,
      },
      orderBy: { arrivedAt: 'desc' },
      skip,
      take: params.limit,
    }),
    prisma.vehicle.count({ where: whereClause }),
  ]);

  return {
    data: vehicles,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

// ──────────────────────────────────────
// POST — Create vehicle + Incoming Job
// ──────────────────────────────────────
export interface CreateVehicleInput {
  vin: string;
  modelCode: string;
  modelName: string;
  colorCode?: string;
  colorName?: string;
  branchId: string;
  warehouse?: string;
  floorplan?: string;
  lotNumber?: string;
  exteriorColor?: string;
  interiorColor?: string;
  wsDate?: string;
  productionYear?: string;
  motorBatteryNumber?: string;
}

export async function createVehicleWithIncomingJob(input: CreateVehicleInput) {
  // Check if vehicle already exists
  const existing = await prisma.vehicle.findUnique({ where: { vin: input.vin } });
  if (existing) {
    return { error: 'Vehicle with this VIN already exists', status: 400 };
  }

  const arrivedAt = new Date();
  const incomingDeadline = new Date(arrivedAt.getTime() + 24 * 60 * 60 * 1000);
  const jobNumber = generateJobNumber('INCOMING');

  const vehicle = await prisma.$transaction(async (tx) => {
    const veh = await tx.vehicle.create({
      data: {
        vin: input.vin,
        modelCode: input.modelCode,
        modelName: input.modelName,
        colorCode: input.colorCode,
        colorName: input.colorName,
        branchId: input.branchId,
        warehouse: input.warehouse,
        floorplan: input.floorplan,
        lotNumber: input.lotNumber,
        exteriorColor: input.exteriorColor,
        interiorColor: input.interiorColor,
        wsDate: input.wsDate ? new Date(input.wsDate) : null,
        productionYear: input.productionYear ? parseInt(input.productionYear) : null,
        motorBatteryNumber: input.motorBatteryNumber,
        arrivedAt,
        incomingDeadline,
        currentStatus: 'IN_STOCK',
      },
    });

    await tx.pdiJob.create({
      data: {
        jobNumber,
        pdiType: 'INCOMING',
        status: 'PENDING',
        vehicleVin: input.vin,
        scheduledDate: incomingDeadline,
      },
    });

    return veh;
  });

  return { data: vehicle, status: 201 };
}

// ──────────────────────────────────────
// PUT — Update vehicle details
// ──────────────────────────────────────
export interface UpdateVehicleInput {
  vin?: string;
  modelCode?: string;
  colorName?: string;
  exteriorColor?: string;
  interiorColor?: string;
  productionYear?: string;
  wsDate?: string;
  motorBatteryNumber?: string;
  warehouse?: string;
  floorplan?: string;
  branchId?: string;
}

export async function updateVehicle(currentVin: string, input: UpdateVehicleInput, editorName: string) {
  const current = await prisma.vehicle.findUnique({
    where: { vin: currentVin },
    include: { branch: true },
  });

  if (!current) return { error: 'Vehicle not found', status: 404 };

  // Identify what changed
  const changes: string[] = [];
  const finalVin = input.vin ? input.vin.trim().toUpperCase() : currentVin;

  if (input.vin && input.vin.trim().toUpperCase() !== currentVin.toUpperCase()) {
    const vinUpper = input.vin.trim().toUpperCase();
    const existing = await prisma.vehicle.findUnique({ where: { vin: vinUpper } });
    if (existing) return { error: `เลขตัวถัง (VIN) "${input.vin}" มีอยู่ในระบบแล้ว`, status: 400 };
    changes.push(`เลขตัวถัง (VIN): "${current.vin}" ➔ "${vinUpper}"`);
  }

  if (input.modelCode && input.modelCode !== current.modelCode) {
    const newModelName = MODEL_NAMES[input.modelCode as ModelCode] || input.modelCode;
    changes.push(`รุ่นโมเดล: "${current.modelName}" ➔ "${newModelName}"`);
  }

  if (input.colorName !== undefined && input.colorName !== current.colorName)
    changes.push(`สีหลัก: "${current.colorName || '-'}" ➔ "${input.colorName || '-'}"`);
  if (input.exteriorColor !== undefined && input.exteriorColor !== current.exteriorColor)
    changes.push(`ลักษณะสีภายนอก: "${current.exteriorColor || '-'}" ➔ "${input.exteriorColor || '-'}"`);
  if (input.interiorColor !== undefined && input.interiorColor !== current.interiorColor)
    changes.push(`โทนตกแต่งภายใน: "${current.interiorColor || '-'}" ➔ "${input.interiorColor || '-'}"`);
  if (input.productionYear !== undefined && parseInt(input.productionYear) !== current.productionYear)
    changes.push(`ปีผลิต: "${current.productionYear || '-'}" ➔ "${input.productionYear || '-'}"`);

  if (input.wsDate !== undefined) {
    const currentWsStr = current.wsDate ? new Date(current.wsDate).toISOString().slice(0, 10) : '-';
    const newWsStr = input.wsDate ? new Date(input.wsDate).toISOString().slice(0, 10) : '-';
    if (currentWsStr !== newWsStr) changes.push(`วันที่ Wholesale: "${currentWsStr}" ➔ "${newWsStr}"`);
  }

  if (input.motorBatteryNumber !== undefined && input.motorBatteryNumber !== current.motorBatteryNumber)
    changes.push(`เลขมอเตอร์แบตเตอรี่: "${current.motorBatteryNumber || '-'}" ➔ "${input.motorBatteryNumber || '-'}"`);
  if (input.warehouse !== undefined && input.warehouse !== current.warehouse)
    changes.push(`คลังสินค้าโกดัง: "${current.warehouse || '-'}" ➔ "${input.warehouse || '-'}"`);
  if (input.floorplan !== undefined && input.floorplan !== current.floorplan)
    changes.push(`ตำแหน่งจอด: "${current.floorplan || '-'}" ➔ "${input.floorplan || '-'}"`);

  if (input.branchId !== undefined && input.branchId !== current.branchId) {
    const newBranch = await prisma.branch.findUnique({ where: { id: input.branchId } });
    changes.push(`สาขา: "${current.branch?.name || '-'}" ➔ "${newBranch?.name || '-'}"`);
  }

  if (changes.length === 0) return { data: current, status: 200 };

  const updated = await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { vin: currentVin },
      data: {
        vin: input.vin ? input.vin.trim().toUpperCase() : undefined,
        modelCode: input.modelCode || undefined,
        modelName: input.modelCode ? (MODEL_NAMES[input.modelCode as ModelCode] || input.modelCode) : undefined,
        colorName: input.colorName !== undefined ? input.colorName : undefined,
        exteriorColor: input.exteriorColor !== undefined ? input.exteriorColor : undefined,
        interiorColor: input.interiorColor !== undefined ? input.interiorColor : undefined,
        productionYear: input.productionYear !== undefined ? (input.productionYear ? parseInt(input.productionYear) : null) : undefined,
        wsDate: input.wsDate !== undefined ? (input.wsDate ? new Date(input.wsDate) : null) : undefined,
        motorBatteryNumber: input.motorBatteryNumber !== undefined ? input.motorBatteryNumber : undefined,
        warehouse: input.warehouse !== undefined ? input.warehouse : undefined,
        floorplan: input.floorplan !== undefined ? input.floorplan : undefined,
        branchId: input.branchId !== undefined ? input.branchId : undefined,
      },
    });

    await tx.vehicleEditLog.create({
      data: { vehicleVin: finalVin, editedBy: editorName, changeDetails: changes.join(', ') },
    });

    return tx.vehicle.findUnique({
      where: { vin: finalVin },
      include: {
        branch: true,
        pdiJobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            inspector: { select: { id: true, name: true } },
            approver: { select: { id: true, name: true } },
          },
        },
        editLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
  });

  return { data: updated, status: 200 };
}

// ──────────────────────────────────────
// Bulk Import
// ──────────────────────────────────────
export interface ValidatedImportVehicle {
  vin: string;
  modelCode: string;
  modelName: string;
  colorName: string;
  exteriorColor: string | null;
  interiorColor: string | null;
  productionYear: number | null;
  wsDate: Date;
  branchId: string;
  warehouse: string | null;
  floorplan: string | null;
  lotNumber: string | null;
  motorBatteryNumber: string | null;
}

export async function bulkImportVehicles(validatedVehicles: ValidatedImportVehicle[]) {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const arrivedAt = new Date();
  const incomingDeadline = new Date(arrivedAt.getTime() + 24 * 60 * 60 * 1000);

  const vehicleDataArray = validatedVehicles.map(item => ({
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
    lotNumber: item.lotNumber,
    motorBatteryNumber: item.motorBatteryNumber,
    arrivedAt,
    incomingDeadline,
    currentStatus: 'IN_STOCK' as const,
  }));

  const jobDataArray = validatedVehicles.map(item => {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return {
      jobNumber: `JO-INC-${todayStr}-${rand}`,
      pdiType: 'INCOMING' as const,
      status: 'PENDING' as const,
      vehicleVin: item.vin,
      scheduledDate: incomingDeadline,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.createMany({ data: vehicleDataArray });
    await tx.pdiJob.createMany({ data: jobDataArray });
  });

  return validatedVehicles.length;
}

// ──────────────────────────────────────
// DELETE — Remove vehicle (hard delete)
// ──────────────────────────────────────
export async function deleteVehicle(vin: string) {
  const existing = await prisma.vehicle.findUnique({
    where: { vin },
    select: { vin: true, modelName: true },
  });

  if (!existing) return { error: 'Vehicle not found', status: 404 };

  // Prisma cascade (onDelete: Cascade) will automatically remove:
  // PdiJob → ChecklistResult, Defect, JobDocument, BatteryTestResult
  // Defect (direct relation)
  // VehicleEditLog
  await prisma.vehicle.delete({ where: { vin } });

  return { data: { vin: existing.vin, modelName: existing.modelName }, status: 200 };
}

// ──────────────────────────────────────
// Start Incoming PDI (batch)
// ──────────────────────────────────────
export async function startIncomingPdi(vins: string[]) {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const results = await prisma.$transaction(async (tx) => {
    const jobs = [];
    for (const vin of vins) {
      const vehicle = await tx.vehicle.findUnique({ where: { vin } });
      if (!vehicle) throw new Error(`Vehicle with VIN ${vin} not found`);

      const existingJob = await tx.pdiJob.findFirst({
        where: { vehicleVin: vin, pdiType: 'INCOMING' },
      });
      if (existingJob) continue;

      const now = new Date();
      const incomingDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
      const jobNumber = `JO-INC-${todayStr}-${rand}`;

      const job = await tx.pdiJob.create({
        data: {
          jobNumber,
          pdiType: 'INCOMING',
          status: 'PENDING',
          vehicleVin: vin,
          scheduledDate: incomingDeadline,
        },
      });

      await tx.vehicle.update({
        where: { vin },
        data: { arrivedAt: now, incomingDeadline },
      });

      jobs.push(job);
    }
    return jobs;
  });

  return results.length;
}
