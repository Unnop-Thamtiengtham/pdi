import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import {
  getJobById,
  listJobs,
  createJob,
  VALID_PDI_TYPES,
  VALID_PDI_STATUSES,
  validateUserExists,
  saveChecklistResults,
  saveBatteryResults,
  saveDefects,
  markDefectsInRepair,
  completeRepair,
  buildJobUpdateData,
  updateJobAndSideEffects,
} from '@/modules/pdi-jobs/service';

// GET /api/pdi-jobs
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const jobId = req.nextUrl.searchParams.get('id');
    const statusParam = req.nextUrl.searchParams.get('status');
    const typeParam = req.nextUrl.searchParams.get('type');

    // Validate enum params
    if (statusParam && !VALID_PDI_STATUSES.has(statusParam as any)) {
      return NextResponse.json({ error: `Invalid status: ${statusParam}` }, { status: 400 });
    }
    if (typeParam && !VALID_PDI_TYPES.has(typeParam as any)) {
      return NextResponse.json({ error: `Invalid PDI type: ${typeParam}` }, { status: 400 });
    }

    // Single job lookup
    if (jobId) {
      const job = await getJobById(jobId);
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      if (isBranchRestricted && job.vehicle.branchId !== userBranchId) {
        return NextResponse.json({ error: 'Unauthorized to view job from another branch' }, { status: 403 });
      }
      return NextResponse.json(job);
    }

    // List with pagination
    const result = await listJobs(
      {
        status: statusParam || undefined,
        pdiType: typeParam || undefined,
        vin: req.nextUrl.searchParams.get('vin') || undefined,
        branchId: req.nextUrl.searchParams.get('branchId') || undefined,
        page: parseInt(req.nextUrl.searchParams.get('page') || '1', 10),
        limit: Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100),
      },
      isBranchRestricted ? userBranchId : undefined
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching PDI jobs:', error);
    return safeErrorResponse(error);
  }
}

// POST /api/pdi-jobs
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const body = await req.json();

    if (!body.pdiType || !body.vehicleVin) {
      return NextResponse.json({ error: 'Missing required fields: pdiType, vehicleVin' }, { status: 400 });
    }
    if (!VALID_PDI_TYPES.has(body.pdiType as any)) {
      return NextResponse.json({ error: `Invalid PDI type: ${body.pdiType}` }, { status: 400 });
    }

    // Branch restriction check delegated to service via vehicle lookup
    const result = await createJob(body);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    console.error('Error creating PDI job:', error);
    return safeErrorResponse(error);
  }
}

// PATCH /api/pdi-jobs
export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const body = await req.json();
    const { jobId, status } = body;

    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    if (status && !VALID_PDI_STATUSES.has(status as any)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    // Verify job exists + branch access
    const existingJob = await getJobById(jobId);
    if (!existingJob) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (isBranchRestricted && existingJob.vehicle.branchId !== userBranchId) {
      return NextResponse.json({ error: 'Unauthorized to modify job from another branch' }, { status: 403 });
    }

    // Role guard for approve/reject
    if (status === 'APPROVED' || status === 'REJECTED') {
      if (userRole !== 'SUPERVISOR' && userRole !== 'SUPER_ADMIN' && userRole !== 'MASTER') {
        return NextResponse.json({ error: 'Forbidden: เฉพาะหัวหน้างาน (Supervisor) ขึ้นไปเท่านั้นที่สามารถอนุมัติ/ปฏิเสธงานได้' }, { status: 403 });
      }
    }

    // Pre-validate user references
    if (body.inspectorId && !(await validateUserExists(body.inspectorId))) {
      return NextResponse.json({ error: 'เซสชันผู้ใช้งานช่างตรวจไม่พบในฐานข้อมูล กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง' }, { status: 400 });
    }
    if (body.approverId && !(await validateUserExists(body.approverId))) {
      return NextResponse.json({ error: 'เซสชันผู้อนุมัติไม่พบในฐานข้อมูล กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง' }, { status: 400 });
    }

    // 1. Checklist results
    if (body.results?.length) await saveChecklistResults(jobId, body.results);

    // 2. Battery data
    if (body.batteryData) await saveBatteryResults(jobId, body.batteryData);

    // 3. Defects
    if (body.defects) await saveDefects(jobId, existingJob.vehicleVin, body.defects);

    // 4. Repair flow
    if (body.sentToRepairAt) await markDefectsInRepair(jobId);
    if (body.repairCompleted) {
      const repairError = await completeRepair(jobId, body.repairPhotos);
      if (repairError) {
        return NextResponse.json({ error: repairError.error }, { status: repairError.status });
      }
    }

    // 5. Update job status + side effects
    const updateData = buildJobUpdateData(body);
    const job = await updateJobAndSideEffects(jobId, updateData);

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error saving PDI results:', error);
    return safeErrorResponse(error);
  }
}
