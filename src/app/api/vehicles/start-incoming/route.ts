import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { startIncomingPdi } from '@/modules/vehicles/service';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = new Set(['INSPECTOR', 'SUPERVISOR', 'MASTER']);

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  const userRole = session.user?.role;
  const userBranchId = session.user?.branchId;

  // 1. Check if user role is allowed to start PDI
  if (!userRole || !ALLOWED_ROLES.has(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden: คุณไม่มีสิทธิ์เริ่มงาน PDI สภาพแรกรับ' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { vins } = body;

    if (!vins || !Array.isArray(vins) || vins.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameter: vins' }, { status: 400 });
    }

    const cleanVins = vins.map(v => String(v).trim().toUpperCase());

    // 2. BOLA Check: Restrict access to branch vehicles for branch-restricted users
    const isBranchRestricted = userRole !== 'MASTER' && userBranchId;
    if (isBranchRestricted) {
      const vehicles = await prisma.vehicle.findMany({
        where: { vin: { in: cleanVins } },
        select: { vin: true, branchId: true },
      });

      const vehiclesMap = new Map(vehicles.map(v => [v.vin.toUpperCase(), v.branchId]));
      for (const vin of cleanVins) {
        const dbBranchId = vehiclesMap.get(vin);
        if (!dbBranchId) {
          return NextResponse.json(
            { error: `ไม่พบข้อมูลรถยนต์เลขตัวถัง (VIN) "${vin}" ในระบบ` },
            { status: 404 }
          );
        }
        if (dbBranchId !== userBranchId) {
          return NextResponse.json(
            { error: `คุณไม่มีสิทธิ์เริ่มต้น PDI สำหรับรถยนต์สาขาอื่น (VIN: "${vin}")` },
            { status: 403 }
          );
        }
      }
    }

    const count = await startIncomingPdi(cleanVins);

    return NextResponse.json({
      success: true,
      message: `Started incoming PDI for ${count} vehicles.`,
      jobsCount: count,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error starting incoming PDI:', error);
    return safeErrorResponse(error);
  }
}
