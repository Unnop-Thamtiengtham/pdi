import 'dotenv/config';
import { PrismaClient, VehicleStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑️  Clearing all existing vehicles and PDI jobs...');

  await prisma.defect.deleteMany({});
  await prisma.checklistResult.deleteMany({});
  await prisma.batteryTestResult.deleteMany({});
  await prisma.jobDocument.deleteMany({});
  await prisma.pdiJob.deleteMany({});
  await prisma.vehicleEditLog.deleteMany({});
  await prisma.vehicle.deleteMany({});

  console.log('✅ Cleared all existing vehicles and jobs.');

  const branchGI02 =
    (await prisma.branch.findUnique({ where: { code: 'GI02' } })) ||
    (await prisma.branch.findFirst({ orderBy: { code: 'asc' } }));

  if (!branchGI02) {
    throw new Error('No branch found in database.');
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  const vehiclesData = [
    {
      vin: 'LNBSCCAK4RD100101',
      modelCode: 'AION_V',
      modelName: 'AION V',
      colorCode: 'PW01',
      colorName: 'Pearl White',
      exteriorColor: 'ขาวมุก (Pearl White)',
      interiorColor: 'ดำ-เทา (Black-Grey)',
      productionYear: 2026,
      branchId: branchGI02.id,
      warehouse: 'คลัง A',
      floorplan: 'Zone 1',
      lotNumber: 'LOT-202607-001',
      arrivedAt: now,
      incomingDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      currentStatus: VehicleStatus.IN_STOCK,
      motorBatteryNumber: 'TZ220XS-BAT-V-001',
    },
    {
      vin: 'LNBHHTCK3RD300310',
      modelCode: 'HYPTEC_HT',
      modelName: 'HYPTEC HT',
      colorCode: 'MB03',
      colorName: 'Midnight Blue',
      exteriorColor: 'น้ำเงินเข้ม (Midnight Blue)',
      interiorColor: 'ดำ-แดง (Black-Red)',
      productionYear: 2026,
      branchId: branchGI02.id,
      warehouse: 'คลัง B',
      floorplan: 'Zone 1',
      lotNumber: 'LOT-202607-001',
      arrivedAt: now,
      incomingDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      currentStatus: VehicleStatus.IN_STOCK,
      motorBatteryNumber: 'TZ230XS-BAT-HT-003',
    },
  ];

  for (const v of vehiclesData) {
    await prisma.vehicle.create({ data: v });

    const rand = Math.floor(100000 + Math.random() * 900000);
    const jobNumber = `JO-INC-${todayStr}-${rand}`;
    await prisma.pdiJob.create({
      data: {
        jobNumber,
        pdiType: 'INCOMING',
        status: 'PENDING',
        vehicleVin: v.vin,
        scheduledDate: v.incomingDeadline,
      },
    });
  }

  const allVehicles = await prisma.vehicle.findMany({
    include: { branch: true, pdiJobs: true },
  });
  console.log(`🚗 Created ${allVehicles.length} vehicles in DB:`);
  for (const v of allVehicles) {
    console.log(`   - ${v.vin} | ${v.modelName} (${v.colorName}) | สาขา [${v.branch.code}] ${v.branch.name}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error resetting vehicles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

