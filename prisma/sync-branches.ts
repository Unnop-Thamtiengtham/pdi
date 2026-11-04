import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OLD_TO_NEW_CODE: Record<string, string> = {
  KJN: 'GI01',
  MBR: 'GI02',
  LBD: 'GI03',
  MHC: 'GI07',
  SLY: 'GI08',
  PBL: 'GI10',
  AYT: 'GI11',
};

const TARGET_BRANCHES = [
  { code: 'GI', name: 'บริษัท โกลด์ อินทิเกรท จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI01', name: 'บริษัท โกลด์อินทิเกรท กาญจนาภิเษก – บางแค จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI02', name: 'บริษัท โกลด์ อินทิเกรท มีนบุรี จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI03', name: 'บริษัท โกลด์ อินทิเกรท เลียบด่วนรามอินทรา จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI04', name: 'บริษัท โกลด์ อินทิเกรท สีลม ซอย 9 จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI05', name: 'บริษัท โกลด์ อินทิเกรท อุบลราชธานี จำกัด', address: 'เลขที่ 77 หมู่ที่ 26 ตำบล ขามใหญ่ อำเภอ เมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000' },
  { code: 'GI06', name: 'EV7 Co.,Ltd.', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI07', name: 'บริษัท โกลด์ อินทิเกรท มหาชัย จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI08', name: 'บริษัท โกลด์ อินทิเกรท ศาลายา จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI09', name: 'บริษัท โกลด์ อินทิเกรท วิภาวดี จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI10', name: 'บริษัท โกลด์ อินทิเกรท พิบูลสงคราม จำกัด', address: 'ที่อยู่ 549/1 ชั้นที่ 3 ถ.สรรพาวุธ แขวงบางนาใต้ เขตบางนา กทม. 10260' },
  { code: 'GI11', name: 'บริษัท โกลด์ อินทิเกรท อยุธยา จำกัด', address: 'เลขที่ 99/5 ชั้นที่1 หมู่ที่ 1 ตำบล คุ้งลาน อำเภอ บางปะอิน จังหวัดพระนครศรีอยุธยา 13160' },
  { code: 'GI12', name: 'บริษัท โกลด์ อินทิเกรท เชียงใหม่ จำกัด', address: 'เลขที่ 486/1 ถนนเชียงใหม่-ลำปาง ตำบล ท่าศาลา อำเภอ เมืองเชียงใหม่ จังหวัดเชียงใหม่ 50000' },
];

async function main() {
  console.log('🔄 Syncing branches in PostgreSQL...');

  // 1. Rename old branch codes in-place so existing relations stay intact
  for (const [oldCode, newCode] of Object.entries(OLD_TO_NEW_CODE)) {
    const existingOld = await prisma.branch.findUnique({ where: { code: oldCode } });
    const existingNew = await prisma.branch.findUnique({ where: { code: newCode } });
    if (existingOld && !existingNew) {
      await prisma.branch.update({
        where: { id: existingOld.id },
        data: { code: newCode },
      });
      console.log(`✅ Renamed branch code ${oldCode} -> ${newCode}`);
    }
  }

  // 2. Upsert all 13 target branches
  for (const b of TARGET_BRANCHES) {
    await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, address: b.address },
      create: b,
    });
  }

  // 3. Remove obsolete PPD branch if present
  const ppd = await prisma.branch.findUnique({ where: { code: 'PPD' } });
  if (ppd) {
    const gi = await prisma.branch.findUnique({ where: { code: 'GI' } });
    if (gi) {
      await prisma.vehicle.updateMany({ where: { branchId: ppd.id }, data: { branchId: gi.id } });
      await prisma.user.updateMany({ where: { branchId: ppd.id }, data: { branchId: gi.id } });
    }
    await prisma.branch.delete({ where: { id: ppd.id } });
    console.log('🗑️  Removed obsolete branch PPD');
  }

  const all = await prisma.branch.findMany({ orderBy: { code: 'asc' } });
  console.log('🏢 Updated branches in DB:');
  for (const x of all) {
    console.log(`   - [${x.code}] ${x.name} | ${x.address}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error syncing branches:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

