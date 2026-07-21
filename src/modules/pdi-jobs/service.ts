import { prisma } from '@/lib/prisma';
import { PdiStatus, PdiType, DefectStatus, VehicleStatus } from '@prisma/client';
import { triggerWebhook } from '@/modules/webhook/service';
import crypto from 'crypto';

// ──────────────────────────────────────
// Constants
// ──────────────────────────────────────
export const VALID_PDI_TYPES = new Set(Object.values(PdiType));
export const VALID_PDI_STATUSES = new Set(Object.values(PdiStatus));

// ──────────────────────────────────────
// GET — Single Job by ID
// ──────────────────────────────────────
export async function getJobById(jobId: string) {
  const job = await prisma.pdiJob.findUnique({
    where: { id: jobId },
    include: {
      vehicle: { include: { branch: true } },
      inspector: { select: { id: true, name: true, employeeId: true } },
      approver: { select: { id: true, name: true, employeeId: true } },
      checklistItems: { include: { item: true } },
      defects: true,
      documents: true,
      batteryTest: true,
    },
  });

  if (!job) return null;

  // Map batteryTest → batteryTestResult to preserve expected response shape
  const { batteryTest, ...rest } = job;
  return { ...rest, batteryTestResult: batteryTest };
}

// ──────────────────────────────────────
// GET — List Jobs with filters + pagination
// ──────────────────────────────────────
export interface ListJobsParams {
  status?: string;
  pdiType?: string;
  vin?: string;
  branchId?: string;
  page: number;
  limit: number;
}

export async function listJobs(params: ListJobsParams, branchFilter?: string) {
  const { status, pdiType, vin, branchId, page, limit } = params;
  const where: any = {};

  if (status) where.status = status as PdiStatus;
  if (pdiType) where.pdiType = pdiType as PdiType;
  if (vin) where.vehicleVin = vin;

  if (branchFilter) {
    where.vehicle = { branchId: branchFilter };
  } else if (branchId) {
    where.vehicle = { branchId };
  }

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.pdiJob.findMany({
      where,
      include: {
        vehicle: { include: { branch: true } },
        inspector: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        defects: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pdiJob.count({ where }),
  ]);

  return {
    data: jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ──────────────────────────────────────
// POST — Create PDI Job
// ──────────────────────────────────────
export interface CreateJobInput {
  pdiType: string;
  vehicleVin: string;
  ltmInterval?: string;
  scheduledDate?: string;
  targetDeliveryDate?: string;
  salesName?: string;
  salesPhone?: string;
  salesBranch?: string;
  customerName?: string;
  customerPhone?: string;
}

export function generateJobNumber(pdiType: string): string {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  const prefix = pdiType === 'INCOMING' ? 'INC' : pdiType === 'LONG_TERM' ? 'LTM' : 'PD';
  return `JO-${prefix}-${todayStr}-${rand}`;
}

export async function createJob(input: CreateJobInput) {
  const { pdiType, vehicleVin } = input;

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
  if (!vehicle) return { error: 'Vehicle not found', status: 404 };

  // Verify INCOMING job is APPROVED before creating LONG_TERM or PRE_DELIVERY
  if (pdiType === 'LONG_TERM' || pdiType === 'PRE_DELIVERY') {
    const incomingJob = await prisma.pdiJob.findFirst({
      where: { vehicleVin, pdiType: 'INCOMING' },
    });
    if (!incomingJob || incomingJob.status !== 'APPROVED') {
      return {
        error: 'ไม่สามารถสร้างใบงานได้ เนื่องจากรถยนต์คันนี้ยังไม่ผ่านการตรวจสภาพแรกรับ (Incoming PDI) หรือกำลังอยู่ในกระบวนการตรวจ',
        status: 400,
      };
    }
  }

  const jobNumber = generateJobNumber(pdiType);

  const job = await prisma.pdiJob.create({
    data: {
      jobNumber,
      pdiType: pdiType as PdiType,
      status: PdiStatus.PENDING,
      vehicleVin,
      ltmInterval: input.ltmInterval ? parseInt(input.ltmInterval) : null,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      targetDeliveryDate: input.targetDeliveryDate ? new Date(input.targetDeliveryDate) : null,
      salesName: input.salesName,
      salesPhone: input.salesPhone,
      salesBranch: input.salesBranch,
      customerPhone: input.customerPhone,
    },
  });

  return { data: job, status: 201 };
}

// ──────────────────────────────────────
// PATCH — Save inspection results
// ──────────────────────────────────────
export interface UpdateJobInput {
  jobId: string;
  results?: any[];
  defects?: any[];
  batteryData?: any;
  status?: string;
  inspectorId?: string;
  approverId?: string;
  notes?: string;
  sentToRepairAt?: string;
  repairLocation?: string;
  repairNotes?: string;
  repairCompleted?: boolean;
  repairPhotos?: any[];
  customerSig?: string;
  inspectorSig?: string;
  supervisorSig?: string;
  pdpaConsent?: boolean;
}

export async function validateUserExists(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return !!user;
}

export async function saveChecklistResults(jobId: string, results: any[]) {
  await prisma.$transaction(
    results.map((r: any) =>
      prisma.checklistResult.upsert({
        where: { jobId_itemId: { jobId, itemId: r.itemId } },
        update: {
          result: r.result,
          numericValue: r.numericValue !== undefined ? r.numericValue : null,
          numericValue2: r.numericValue2 !== undefined ? r.numericValue2 : null,
          photoUrl: r.photoUrl || null,
          remark: r.remark || null,
          checkedAt: new Date(),
        },
        create: {
          jobId,
          itemId: r.itemId,
          result: r.result,
          numericValue: r.numericValue !== undefined ? r.numericValue : null,
          numericValue2: r.numericValue2 !== undefined ? r.numericValue2 : null,
          photoUrl: r.photoUrl || null,
          remark: r.remark || null,
        },
      })
    )
  );
}

export async function saveBatteryResults(jobId: string, batteryData: any) {
  await prisma.batteryTestResult.upsert({
    where: { jobId },
    update: {
      mainVoltage: batteryData.mainVoltage,
      mainSoh: batteryData.mainSoh,
      mainCca: batteryData.mainCca,
      mainSoc: batteryData.mainSoc,
      secVoltage: batteryData.secVoltage,
      secSoh: batteryData.secSoh,
      hvBatteryLevel: batteryData.hvBatteryLevel,
      tirePressure: batteryData.tirePressure,
      reportPhotoUrl: batteryData.reportPhotoUrl,
      terminalCheck: batteryData.terminalCheck,
    },
    create: {
      jobId,
      mainVoltage: batteryData.mainVoltage,
      mainSoh: batteryData.mainSoh,
      mainCca: batteryData.mainCca,
      mainSoc: batteryData.mainSoc,
      secVoltage: batteryData.secVoltage,
      secSoh: batteryData.secSoh,
      hvBatteryLevel: batteryData.hvBatteryLevel,
      tirePressure: batteryData.tirePressure,
      reportPhotoUrl: batteryData.reportPhotoUrl,
      terminalCheck: batteryData.terminalCheck,
    },
  });
}

export async function saveDefects(jobId: string, vehicleVin: string, defects: any[]) {
  await prisma.defect.deleteMany({ where: { jobId } });
  if (defects.length > 0) {
    await prisma.defect.createMany({
      data: defects.map((d: any, index: number) => ({
        jobId,
        vehicleVin,
        defectNo: index + 1,
        checklistItemCode: d.checklistItemCode || null,
        description: d.description,
        cause: d.cause || null,
        solution: d.solution || null,
        severity: d.severity || 'NORMAL',
        status: (d.status as DefectStatus) || ('OPEN' as DefectStatus),
        photoUrls: d.photoUrls || (d.photoUrl ? [d.photoUrl] : []),
        resolvedAt: d.status === 'RESOLVED' || d.status === 'CLOSED' ? new Date() : null,
      })),
    });
  }
}

export async function markDefectsInRepair(jobId: string) {
  await prisma.defect.updateMany({
    where: { jobId, status: 'OPEN' },
    data: { status: 'IN_REPAIR' },
  });
}

export async function completeRepair(jobId: string, repairPhotos: any[]) {
  const activeDefects = await prisma.defect.findMany({
    where: { jobId, status: { in: ['OPEN', 'IN_REPAIR'] } },
  });

  // Validate: every active defect must have at least 1 repair photo
  for (const defect of activeDefects) {
    const photos = repairPhotos?.find((p: any) => p.defectId === defect.id);
    if (!photos || !photos.photoUrls || photos.photoUrls.length === 0) {
      return {
        error: `กรุณาแนบรูปหลังซ่อมสำหรับจุดบกพร่องที่ ${defect.defectNo}: ${defect.description}`,
        status: 400,
      };
    }
  }

  // Save repair photos & resolve
  for (const defect of activeDefects) {
    const photos = repairPhotos?.find((p: any) => p.defectId === defect.id);
    await prisma.defect.update({
      where: { id: defect.id },
      data: {
        repairPhotoUrls: photos?.photoUrls || [],
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
  }

  // Set FAIL checklist results to REPAIRED
  await prisma.checklistResult.updateMany({
    where: { jobId, result: 'FAIL' },
    data: { result: 'REPAIRED' },
  });

  return null; // success
}

export function buildJobUpdateData(input: UpdateJobInput): Record<string, any> {
  const updateData: any = {};
  const {
    status, sentToRepairAt, repairLocation, repairNotes,
    inspectorId, approverId, notes,
    customerSig, inspectorSig, supervisorSig, pdpaConsent,
  } = input;

  if (status) updateData.status = status as PdiStatus;
  if (sentToRepairAt !== undefined) updateData.sentToRepairAt = sentToRepairAt ? new Date(sentToRepairAt) : null;
  if (repairLocation !== undefined) updateData.repairLocation = repairLocation;
  if (repairNotes !== undefined) updateData.repairNotes = repairNotes;
  if (inspectorId) updateData.inspectorId = inspectorId;
  if (approverId) updateData.approverId = approverId;
  if (notes !== undefined) updateData.notes = notes;
  if (customerSig !== undefined) updateData.customerSig = customerSig;
  if (inspectorSig !== undefined) updateData.inspectorSig = inspectorSig;
  if (supervisorSig !== undefined) updateData.supervisorSig = supervisorSig;
  if (pdpaConsent !== undefined) updateData.pdpaConsent = pdpaConsent;

  // SLA & Timings transitions
  if (status === 'PENDING') {
    updateData.startedAt = null;
    updateData.completedAt = null;
    updateData.inspectorId = null;
    updateData.approverId = null;
  } else if (status === 'IN_PROGRESS') {
    updateData.startedAt = new Date();
  } else if (status === 'PENDING_APPROVAL') {
    updateData.completedAt = new Date();
  } else if (status === 'APPROVED') {
    updateData.approvedAt = new Date();
  }

  return updateData;
}

export async function updateJobAndSideEffects(jobId: string, updateData: Record<string, any>) {
  const job = await prisma.pdiJob.update({
    where: { id: jobId },
    data: updateData,
  });

  // Side effect: update vehicle status on approval
  if (updateData.status === 'APPROVED') {
    let nextVehicleStatus: VehicleStatus = 'IN_STOCK';
    if (job.pdiType === 'PRE_DELIVERY') {
      nextVehicleStatus = 'DELIVERED';
    }
    await prisma.vehicle.update({
      where: { vin: job.vehicleVin },
      data: { currentStatus: nextVehicleStatus },
    });

    // Trigger webhook notification (async, fire-and-forget)
    triggerWebhook(job.id);
  }

  return job;
}
