import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { validateImportBatch } from '@/modules/vehicles/validation';
import { bulkImportVehicles } from '@/modules/vehicles/service';

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const body = await req.json();
    const { vehicles } = body;

    if (!vehicles || !Array.isArray(vehicles)) {
      return NextResponse.json({ error: 'Invalid payload. "vehicles" must be an array.' }, { status: 400 });
    }
    if (vehicles.length === 0) {
      return NextResponse.json({ error: 'No vehicles provided.' }, { status: 400 });
    }

    // Validate batch
    const { validated, errors } = await validateImportBatch(
      vehicles,
      isBranchRestricted ? userBranchId : undefined
    );

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Bulk insert
    const count = await bulkImportVehicles(validated);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${count} vehicles.`,
      count,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error importing vehicles:', error);
    return safeErrorResponse(error);
  }
}
