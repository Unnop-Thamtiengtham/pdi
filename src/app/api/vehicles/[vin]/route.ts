import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MODEL_NAMES, ModelCode } from '@/types/pdi';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const session = await getServerSession(authOptions);
    const editorName = session?.user?.name || 'Unknown User';

    const body = await req.json();
    const {
      vin: newVin,
      modelCode,
      colorName,
      exteriorColor,
      interiorColor,
      productionYear,
      wsDate,
      motorBatteryNumber,
      warehouse,
      floorplan,
      branchId,
    } = body;

    // 1. Fetch current vehicle data to compare
    const current = await prisma.vehicle.findUnique({
      where: { vin },
      include: { branch: true },
    });

    if (!current) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // 2. Identify what changed
    const changes: string[] = [];

    const finalVin = newVin ? newVin.trim().toUpperCase() : vin;
    if (newVin && newVin.trim().toUpperCase() !== vin.toUpperCase()) {
      const vinUpper = newVin.trim().toUpperCase();
      const existing = await prisma.vehicle.findUnique({ where: { vin: vinUpper } });
      if (existing) {
        return NextResponse.json({ error: `เลขตัวถัง (VIN) "${newVin}" มีอยู่ในระบบแล้ว` }, { status: 400 });
      }
      changes.push(`เลขตัวถัง (VIN): "${current.vin}" ➔ "${vinUpper}"`);
    }

    if (modelCode && modelCode !== current.modelCode) {
      const oldModelName = current.modelName;
      const newModelName = MODEL_NAMES[modelCode as ModelCode] || modelCode;
      changes.push(`รุ่นโมเดล: "${oldModelName}" ➔ "${newModelName}"`);
    }

    if (colorName !== undefined && colorName !== current.colorName) {
      changes.push(`สีหลัก: "${current.colorName || '-'}" ➔ "${colorName || '-'}"`);
    }

    if (exteriorColor !== undefined && exteriorColor !== current.exteriorColor) {
      changes.push(`ลักษณะสีภายนอก: "${current.exteriorColor || '-'}" ➔ "${exteriorColor || '-'}"`);
    }

    if (interiorColor !== undefined && interiorColor !== current.interiorColor) {
      changes.push(`โทนตกแต่งภายใน: "${current.interiorColor || '-'}" ➔ "${interiorColor || '-'}"`);
    }

    if (productionYear !== undefined && parseInt(productionYear) !== current.productionYear) {
      changes.push(`ปีผลิต: "${current.productionYear || '-'}" ➔ "${productionYear || '-'}"`);
    }

    if (wsDate !== undefined) {
      const currentWsStr = current.wsDate ? new Date(current.wsDate).toISOString().slice(0, 10) : '-';
      const newWsStr = wsDate ? new Date(wsDate).toISOString().slice(0, 10) : '-';
      if (currentWsStr !== newWsStr) {
        changes.push(`วันที่ Wholesale: "${currentWsStr}" ➔ "${newWsStr}"`);
      }
    }

    if (motorBatteryNumber !== undefined && motorBatteryNumber !== current.motorBatteryNumber) {
      changes.push(`เลขมอเตอร์แบตเตอรี่: "${current.motorBatteryNumber || '-'}" ➔ "${motorBatteryNumber || '-'}"`);
    }

    if (warehouse !== undefined && warehouse !== current.warehouse) {
      changes.push(`คลังสินค้าโกดัง: "${current.warehouse || '-'}" ➔ "${warehouse || '-'}"`);
    }

    if (floorplan !== undefined && floorplan !== current.floorplan) {
      changes.push(`ตำแหน่งจอด: "${current.floorplan || '-'}" ➔ "${floorplan || '-'}"`);
    }

    if (branchId !== undefined && branchId !== current.branchId) {
      const newBranch = await prisma.branch.findUnique({ where: { id: branchId } });
      changes.push(`สาขา: "${current.branch?.name || '-'}" ➔ "${newBranch?.name || '-'}"`);
    }

    if (changes.length === 0) {
      // No fields changed, just return the current vehicle
      return NextResponse.json(current);
    }

    const changeDetails = changes.join(', ');

    // 3. Update vehicle and insert edit log in transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { vin },
        data: {
          vin: newVin ? newVin.trim().toUpperCase() : undefined,
          modelCode: modelCode || undefined,
          modelName: modelCode ? (MODEL_NAMES[modelCode as ModelCode] || modelCode) : undefined,
          colorName: colorName !== undefined ? colorName : undefined,
          exteriorColor: exteriorColor !== undefined ? exteriorColor : undefined,
          interiorColor: interiorColor !== undefined ? interiorColor : undefined,
          productionYear: productionYear !== undefined ? (productionYear ? parseInt(productionYear) : null) : undefined,
          wsDate: wsDate !== undefined ? (wsDate ? new Date(wsDate) : null) : undefined,
          motorBatteryNumber: motorBatteryNumber !== undefined ? motorBatteryNumber : undefined,
          warehouse: warehouse !== undefined ? warehouse : undefined,
          floorplan: floorplan !== undefined ? floorplan : undefined,
          branchId: branchId !== undefined ? branchId : undefined,
        },
      });

      await tx.vehicleEditLog.create({
        data: {
          vehicleVin: finalVin,
          editedBy: editorName,
          changeDetails,
        },
      });

      // Refetch to include the newly created edit log
      const refetched = await tx.vehicle.findUnique({
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
          editLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return refetched;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating vehicle details:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
