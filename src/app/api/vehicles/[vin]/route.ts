import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { updateVehicle, deleteVehicle, getVehicleByVin } from '@/modules/vehicles/service';
import { createAuditLog } from '@/modules/audit/service';

// Roles allowed to update vehicle details
const ALLOWED_UPDATE_ROLES = new Set(['INSPECTOR', 'SUPERVISOR', 'MASTER']);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;

  // Role-based authorization: only specific roles can update vehicles
  if (!userRole || !ALLOWED_UPDATE_ROLES.has(userRole)) {
    return NextResponse.json(
      { error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลรถยนต์ เฉพาะช่างตรวจ (Inspector) ขึ้นไปเท่านั้น' },
      { status: 403 }
    );
  }

  try {
    const { vin } = await params;
    const editorName = session.user?.name || 'Unknown User';
    const body = await req.json();

    // Branch restriction: non-admin roles can only update vehicles in their branch
    const isBranchRestricted = userRole !== 'MASTER' && userBranchId;
    if (isBranchRestricted) {
      // Verify the vehicle belongs to the user's branch
      const vehicle = await getVehicleByVin(vin);
      if (vehicle && vehicle.branchId !== userBranchId) {
        return NextResponse.json(
          { error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลรถยนต์ของสาขาอื่น' },
          { status: 403 }
        );
      }
    }

    const result = await updateVehicle(vin, body, editorName);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await createAuditLog({
      req,
      session,
      action: 'UPDATE_VEHICLE',
      targetType: 'Vehicle',
      targetId: vin,
      details: `แก้ไขข้อมูลรถยนต์: ${Object.keys(body).join(', ')}`,
    });

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error updating vehicle details:', error);
    return safeErrorResponse(error);
  }
}

// Roles allowed to delete vehicles
const ALLOWED_DELETE_ROLES = new Set(['MASTER']);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;

  // Role-based authorization: only MASTER can delete
  if (!userRole || !ALLOWED_DELETE_ROLES.has(userRole)) {
    return NextResponse.json(
      { error: 'คุณไม่มีสิทธิ์ลบรถยนต์ เฉพาะ Master เท่านั้น' },
      { status: 403 }
    );
  }

  try {
    const { vin } = await params;
    const result = await deleteVehicle(vin);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await createAuditLog({
      req,
      session,
      action: 'DELETE_VEHICLE',
      targetType: 'Vehicle',
      targetId: result.data.vin,
      details: `ลบรถยนต์ออกจากระบบ: รุ่น ${result.data.modelName} (VIN: ${result.data.vin})`,
    });

    return NextResponse.json({
      message: `ลบรถยนต์ VIN ${result.data.vin} (${result.data.modelName}) ออกจากระบบแล้ว`,
      vin: result.data.vin,
    });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    return safeErrorResponse(error);
  }
}
