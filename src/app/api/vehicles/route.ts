import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { getVehicleByVin, listVehicles, createVehicleWithIncomingJob } from '@/modules/vehicles/service';

// GET /api/vehicles
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const vin = req.nextUrl.searchParams.get('vin');

    if (vin) {
      const vehicle = await getVehicleByVin(vin);
      if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      if (isBranchRestricted && vehicle.branchId !== userBranchId) {
        return NextResponse.json({ error: 'Unauthorized to view vehicle from another branch' }, { status: 403 });
      }
      return NextResponse.json(vehicle);
    }

    const result = await listVehicles(
      {
        branchId: req.nextUrl.searchParams.get('branchId') || undefined,
        page: parseInt(req.nextUrl.searchParams.get('page') || '1', 10),
        limit: Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100),
      },
      isBranchRestricted ? userBranchId : undefined
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return safeErrorResponse(error);
  }
}

// POST /api/vehicles
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const body = await req.json();
    if (!body.vin || !body.modelCode || !body.modelName || !body.branchId) {
      return NextResponse.json({ error: 'Missing required fields: vin, modelCode, modelName, branchId' }, { status: 400 });
    }
    if (isBranchRestricted && body.branchId !== userBranchId) {
      return NextResponse.json({ error: 'Unauthorized to add vehicles to another branch' }, { status: 403 });
    }

    const result = await createVehicleWithIncomingJob(body);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data, { status: result.status });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return safeErrorResponse(error);
  }
}
