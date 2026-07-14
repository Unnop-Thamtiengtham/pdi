import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/vehicles — ดึงข้อมูลรถเดี่ยว หรือ รายการรถ
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const vin = req.nextUrl.searchParams.get('vin');
    const branchId = req.nextUrl.searchParams.get('branchId');

    if (vin) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { vin },
        include: {
          pdiJobs: {
            orderBy: { createdAt: 'desc' },
            include: {
              inspector: { select: { id: true, name: true, employeeId: true } },
              approver: { select: { id: true, name: true, employeeId: true } },
            },
          },
          branch: true,
        },
      });
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      if (isBranchRestricted && vehicle.branchId !== userBranchId) {
        return NextResponse.json({ error: 'Unauthorized to view vehicle from another branch' }, { status: 403 });
      }
      return NextResponse.json(vehicle);
    }

    // Filter by branch if requested
    let whereClause: any = branchId ? { branchId } : {};
    if (isBranchRestricted) {
      whereClause = { branchId: userBranchId };
    }

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        pdiJobs: {
          orderBy: { createdAt: 'desc' },
        },
        branch: true,
      },
      orderBy: { arrivedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/vehicles — รับรถเข้า stock (Incoming trigger)
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branchId;
  const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

  try {
    const body = await req.json();
    const {
      vin,
      modelCode,
      modelName,
      colorCode,
      colorName,
      branchId,
      warehouse,
      floorplan,
      lotNumber,
      exteriorColor,
      interiorColor,
      wsDate,
      productionYear,
      motorBatteryNumber,
    } = body;

    if (!vin || !modelCode || !modelName || !branchId) {
      return NextResponse.json({ error: 'Missing required fields: vin, modelCode, modelName, branchId' }, { status: 400 });
    }

    if (isBranchRestricted && branchId !== userBranchId) {
      return NextResponse.json({ error: 'Unauthorized to add vehicles to another branch' }, { status: 403 });
    }

    // Check if vehicle already exists
    const existing = await prisma.vehicle.findUnique({ where: { vin } });
    if (existing) {
      return NextResponse.json({ error: 'Vehicle with this VIN already exists' }, { status: 400 });
    }

    const arrivedAt = new Date();
    // SLA starts immediately upon vehicle creation (24 hours)
    const incomingDeadline = new Date(arrivedAt.getTime() + 24 * 60 * 60 * 1000);

    const todayStr = arrivedAt.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100000 + Math.random() * 900000);
    const jobNumber = `JO-INC-${todayStr}-${rand}`;

    const vehicle = await prisma.$transaction(async (tx) => {
      // 1. Create Vehicle
      const veh = await tx.vehicle.create({
        data: {
          vin,
          modelCode,
          modelName,
          colorCode,
          colorName,
          branchId,
          warehouse,
          floorplan,
          lotNumber,
          exteriorColor,
          interiorColor,
          wsDate: wsDate ? new Date(wsDate) : null,
          productionYear: productionYear ? parseInt(productionYear) : null,
          motorBatteryNumber,
          arrivedAt,
          incomingDeadline,
          currentStatus: 'IN_STOCK',
        },
      });

      // 2. Create INCOMING PdiJob
      await tx.pdiJob.create({
        data: {
          jobNumber,
          pdiType: 'INCOMING',
          status: 'PENDING',
          vehicleVin: vin,
          scheduledDate: incomingDeadline,
        },
      });

      return veh;
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
