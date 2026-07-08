import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/vehicles — ดึงข้อมูลรถเดี่ยว หรือ รายการรถ
export async function GET(req: NextRequest) {
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
      return NextResponse.json(vehicle);
    }

    // Filter by branch if requested
    const whereClause = branchId ? { branchId } : {};

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
      exteriorColor,
      interiorColor,
      wsDate,
      productionYear,
      motorBatteryNumber,
    } = body;

    if (!vin || !modelCode || !modelName || !branchId) {
      return NextResponse.json({ error: 'Missing required fields: vin, modelCode, modelName, branchId' }, { status: 400 });
    }

    // Check if vehicle already exists
    const existing = await prisma.vehicle.findUnique({ where: { vin } });
    if (existing) {
      return NextResponse.json({ error: 'Vehicle with this VIN already exists' }, { status: 400 });
    }

    const arrivedAt = new Date();
    // SLA: not started yet, set incomingDeadline to arrivedAt initially
    const incomingDeadline = arrivedAt;

    const vehicle = await prisma.vehicle.create({
      data: {
        vin,
        modelCode,
        modelName,
        colorCode,
        colorName,
        branchId,
        warehouse,
        floorplan,
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

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
