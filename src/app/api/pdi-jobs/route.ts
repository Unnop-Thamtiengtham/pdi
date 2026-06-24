import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PdiStatus, PdiType, DefectStatus } from '@prisma/client';

// GET /api/pdi-jobs — ดึงข้อมูล jobs ทั้งหมด พร้อม filters
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('id');
    const branchId = req.nextUrl.searchParams.get('branchId');
    const statusParam = req.nextUrl.searchParams.get('status');
    const typeParam = req.nextUrl.searchParams.get('type');
    const vinParam = req.nextUrl.searchParams.get('vin');

    if (jobId) {
      const job = await prisma.pdiJob.findUnique({
        where: { id: jobId },
        include: {
          vehicle: {
            include: { branch: true },
          },
          inspector: { select: { id: true, name: true, employeeId: true } },
          approver: { select: { id: true, name: true, employeeId: true } },
          checklistItems: {
            include: { item: true },
          },
          defects: true,
          documents: true,
        },
      });

      // Get battery results separately since it is a separate table
      const battery = await prisma.batteryTestResult.findUnique({
        where: { jobId },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ ...job, batteryTestResult: battery });
    }

    // List filtering
    const where: any = {};

    if (statusParam) where.status = statusParam as PdiStatus;
    if (typeParam) where.pdiType = typeParam as PdiType;
    if (vinParam) where.vehicleVin = vinParam;
    if (branchId) {
      where.vehicle = { branchId };
    }

    const jobs = await prisma.pdiJob.findMany({
      where,
      include: {
        vehicle: {
          include: { branch: true },
        },
        inspector: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        defects: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching PDI jobs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pdi-jobs — สร้าง PDI Job ใหม่ (เช่น Long-term หรือ Pre-delivery)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pdiType,
      vehicleVin,
      ltmInterval,
      scheduledDate,
      targetDeliveryDate,
      salesName,
      customerName,
      customerPhone,
    } = body;

    if (!pdiType || !vehicleVin) {
      return NextResponse.json({ error: 'Missing required fields: pdiType, vehicleVin' }, { status: 400 });
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Generate unique Job Number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefix = pdiType === 'INCOMING' ? 'INC' : pdiType === 'LONG_TERM' ? 'LTM' : 'PD';
    const jobNumber = `JO-${prefix}-${todayStr}-${rand}`;

    const job = await prisma.pdiJob.create({
      data: {
        jobNumber,
        pdiType: pdiType as PdiType,
        status: PdiStatus.PENDING,
        vehicleVin,
        ltmInterval: ltmInterval ? parseInt(ltmInterval) : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
        salesName,
        customerName,
        customerPhone,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Error creating PDI job:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/pdi-jobs — บันทึกผลการตรวจ
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobId,
      results,
      defects,
      batteryData,
      status,
      inspectorId,
      approverId,
      notes,
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // 1. Save Checklist Results
    if (results && Array.isArray(results)) {
      await Promise.all(
        results.map((r: any) =>
          prisma.checklistResult.upsert({
            where: {
              jobId_itemId: {
                jobId,
                itemId: r.itemId,
              },
            },
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

    // 2. Save Battery Test Results
    if (batteryData) {
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
        },
      });
    }

    // 3. Save Defects
    if (defects && Array.isArray(defects)) {
      // Delete old defects and recreate
      await prisma.defect.deleteMany({ where: { jobId } });
      if (defects.length > 0) {
        await prisma.defect.createMany({
          data: defects.map((d: any, index: number) => ({
            jobId,
            defectNo: index + 1,
            checklistItemCode: d.checklistItemCode || null,
            description: d.description,
            cause: d.cause || null,
            solution: d.solution || null,
            severity: d.severity || 'NORMAL',
            status: d.status as DefectStatus || DefectStatus.OPEN,
            photoUrl: d.photoUrl || null,
            resolvedAt: d.status === 'RESOLVED' || d.status === 'CLOSED' ? new Date() : null,
          })),
        });
      }
    }

    // 4. Update PDI Job Status & timestamps
    const updateData: any = {};
    if (status) updateData.status = status as PdiStatus;
    
    if (inspectorId) {
      const userExists = await prisma.user.findUnique({ where: { id: inspectorId } });
      if (!userExists) {
        return NextResponse.json(
          { error: 'เซสชันผู้ใช้งานช่างตรวจไม่พบในฐานข้อมูล (เนื่องจากอาจมีการ Reset/Reseed ฐานข้อมูลล่าสุด) กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง' },
          { status: 400 }
        );
      }
      updateData.inspectorId = inspectorId;
    }

    if (approverId) {
      const userExists = await prisma.user.findUnique({ where: { id: approverId } });
      if (!userExists) {
        return NextResponse.json(
          { error: 'เซสชันผู้อนุมัติไม่พบในฐานข้อมูล (เนื่องจากอาจมีการ Reset/Reseed ฐานข้อมูลล่าสุด) กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง' },
          { status: 400 }
        );
      }
      updateData.approverId = approverId;
    }

    if (notes !== undefined) updateData.notes = notes;

    // SLA & Timings transitions
    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    } else if (status === 'PENDING_APPROVAL') {
      updateData.completedAt = new Date();
    } else if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    }

    const job = await prisma.pdiJob.update({
      where: { id: jobId },
      data: updateData,
    });

    // Side effect: update vehicle status
    if (status === 'APPROVED') {
      let nextVehicleStatus = 'PDI_APPROVED';
      if (job.pdiType === 'INCOMING') {
        nextVehicleStatus = 'IN_STOCK';
      } else if (job.pdiType === 'PRE_DELIVERY') {
        nextVehicleStatus = 'DELIVERED';
      }
      await prisma.vehicle.update({
        where: { vin: job.vehicleVin },
        data: { currentStatus: nextVehicleStatus },
      });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error saving PDI results:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
