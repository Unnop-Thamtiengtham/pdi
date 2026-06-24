import 'dotenv/config';
import { PrismaClient, PdiType, CheckResult, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing data (optional, useful for clean local tests)
  await prisma.defect.deleteMany({});
  await prisma.checklistResult.deleteMany({});
  await prisma.checklistResult.deleteMany({});
  await prisma.checklistResult.deleteMany({});
  await prisma.checklistItem.deleteMany({});
  await prisma.checklistTemplate.deleteMany({});
  await prisma.pdiJob.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  console.log('🗑️  Cleaned up old records.');

  // 2. Create Branches
  const branchMBR = await prisma.branch.create({
    data: {
      code: 'MBR',
      name: 'มีนบุรี',
      address: '123 ถนนสุวินทวงศ์ มีนบุรี กรุงเทพฯ',
    },
  });

  const branchRCD = await prisma.branch.create({
    data: {
      code: 'RCD',
      name: 'รัชดา',
      address: '456 ถนนรัชดาภิเษก ห้วยขวาง กรุงเทพฯ',
    },
  });

  console.log('🏢 Created branches:', branchMBR.code, branchRCD.code);

  // 3. Create Users
  const passwordHash = bcrypt.hashSync('password123', 10);

  const users = [
    {
      employeeId: 'EMP-ADMIN',
      name: 'กิตติพงษ์ แอดมิน',
      email: 'admin@pdi.com',
      passwordHash,
      role: UserRole.ADMIN,
      branchId: branchMBR.id,
    },
    {
      employeeId: 'EMP-INSPECT',
      name: 'สมชาย ช่างตรวจ',
      email: 'inspector@pdi.com',
      passwordHash,
      role: UserRole.INSPECTOR,
      branchId: branchMBR.id,
    },
    {
      employeeId: 'EMP-SUPER',
      name: 'ธีรพล ซุปเปอร์ไวเซอร์',
      email: 'supervisor@pdi.com',
      passwordHash,
      role: UserRole.SUPERVISOR,
      branchId: branchMBR.id,
    },
    {
      employeeId: 'EMP-MGR',
      name: 'กิตติศักดิ์ ผู้จัดการสาขา',
      email: 'manager@pdi.com',
      passwordHash,
      role: UserRole.BRANCH_MANAGER,
      branchId: branchMBR.id,
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  console.log('👤 Created test users.');

  // 4. Create Checklist Templates for all models and all types
  const models = ['AION_V', 'AION_UT', 'AION_YP', 'AION_ES', 'HYPTEC_HT', 'HYPTEC_SSR', 'GAC_M8'];
  const types = [PdiType.INCOMING, PdiType.LONG_TERM, PdiType.PRE_DELIVERY];

  for (const modelCode of models) {
    for (const pdiType of types) {
      const itemsData = [];

      // Category 1: Exterior
      itemsData.push(
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_001', itemName: 'ประตู', itemOrder: 1 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_002', itemName: 'ฝากระโปรงหน้า/หลัง', itemOrder: 2 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_003', itemName: 'กันชนหน้า/หลัง', itemOrder: 3 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_004', itemName: 'แก้มบังโคลน', itemOrder: 4 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_005', itemName: 'กระจกมองข้าง', itemOrder: 5 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_006', itemName: 'อุปกรณ์ตกแต่งภายในห้องโดยสาร', itemOrder: 6 }
      );

      // Model Rule: HYPTEC_HT has Gullwing Doors
      if (modelCode === 'HYPTEC_HT') {
        itemsData.push({
          category: 'ลักษณะภายนอกและสี',
          categoryOrder: 1,
          itemCode: 'EXT_007',
          itemName: 'ฟังก์ชันประตูปีกนก (Gullwing Doors)',
          itemOrder: 7,
          isMandatory: true,
          hasPhoto: true,
        });
      }

      // Category 2: Lighting
      itemsData.push(
        { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_001', itemName: 'ไฟหน้า', itemOrder: 1 },
        { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_002', itemName: 'ไฟท้าย', itemOrder: 2 },
        { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_003', itemName: 'ไฟเลี้ยวและไฟฉุกเฉิน', itemOrder: 3 },
        { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_004', itemName: 'ไฟ DRL (Daytime Running Light)', itemOrder: 4 },
        { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_005', itemName: 'ไฟส่องป้ายทะเบียน', itemOrder: 5 },
        { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_006', itemName: 'ไฟถอยหลัง', itemOrder: 6 }
      );

      // Category 3: Glass & Wipers
      itemsData.push(
        { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_001', itemName: 'ระบบปรับกระจกไฟฟ้า / ระบบกันหนีบ', itemOrder: 1 },
        { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_002', itemName: 'การทำงานของที่ปัดน้ำฝนหน้า', itemOrder: 2 },
        { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_003', itemName: 'ฟังก์ชันฉีดน้ำทำความสะอาดกระจก', itemOrder: 3 }
      );

      // Category 4: AC
      itemsData.push(
        { category: 'ระบบปรับอากาศ', categoryOrder: 4, itemCode: 'AC_001', itemName: 'การทำความเย็นและความร้อน', itemOrder: 1 },
        { category: 'ระบบปรับอากาศ', categoryOrder: 4, itemCode: 'AC_002', itemName: 'การปรับความแรงลมและทิศทางลม', itemOrder: 2 }
      );

      // Category 5: Infotainment
      itemsData.push(
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_001', itemName: 'กล้องมองภาพรอบทิศทาง 360 องศา', itemOrder: 1 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_002', itemName: 'ระบบเสียงและลำโพง', itemOrder: 2 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_003', itemName: 'ฟังก์ชันเชื่อมต่อบลูทูธและโทรศัพท์', itemOrder: 3 }
      );

      // Category 6: Fluids
      itemsData.push(
        { category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_001', itemName: 'ระดับน้ำยาหล่อเย็นอินเวอร์เตอร์/มอเตอร์', itemOrder: 1 },
        { category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_002', itemName: 'ระดับน้ำมันเบรก', itemOrder: 2 },
        { category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_003', itemName: 'ระดับน้ำฉีดกระจก', itemOrder: 3 }
      );

      // Category 7: Chassis
      itemsData.push(
        { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_001', itemName: 'ลักษณะภายนอกของชุดแบตเตอรี่แรงดันสูง (HV Battery)', itemOrder: 1, hasPhoto: true },
        { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_002', itemName: 'ท่อส่งน้ำยาหล่อเย็นแบตเตอรี่และการรั่วซึม', itemOrder: 2 },
        { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_003', itemName: 'การขันยึดน็อตและโครงสร้างช่วงล่าง', itemOrder: 3 }
      );

      // Category 8: Brake
      itemsData.push(
        { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_001', itemName: 'ฟังก์ชันห้ามล้อและเบรกมือไฟฟ้า', itemOrder: 1 },
        { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_002', itemName: 'การตอบสนองของพวงมาลัยและการเลี้ยว', itemOrder: 2 }
      );

      // Category 9: Battery 12V (Model-Specific Battery Test Rules)
      if (modelCode === 'AION_V' || modelCode === 'HYPTEC_HT') {
        // Dual Battery setup
        itemsData.push(
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_001',
            itemName: 'ค่าแรงดันไฟฟ้าแบตเตอรี่ (หลัก) [เกณฑ์ ≥ 12.6V]',
            itemOrder: 1,
            hasNumeric: true,
            numericUnit: 'V',
            numericMin: 12.6,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_002',
            itemName: 'อายุขัยสุขภาพแบตเตอรี่ SOH (หลัก) [เกณฑ์ ≥ 80%]',
            itemOrder: 2,
            hasNumeric: true,
            numericUnit: '%',
            numericMin: 80,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_003',
            itemName: 'ค่าแรงดันไฟฟ้าแบตเตอรี่ (รอง) [เกณฑ์ ≥ 12.6V]',
            itemOrder: 3,
            hasNumeric: true,
            numericUnit: 'V',
            numericMin: 12.6,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_004',
            itemName: 'อายุขัยสุขภาพแบตเตอรี่ SOH (รอง) [เกณฑ์ ≥ 80%]',
            itemOrder: 4,
            hasNumeric: true,
            numericUnit: '%',
            numericMin: 80,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_005',
            itemName: 'ขั้วลบแบตเตอรี่ขันแน่นหนาและแข็งแรง',
            itemOrder: 5,
          }
        );
      } else if (modelCode === 'AION_YP') {
        // AION Y Plus: SOH, CCA, SOC, Tire pressure
        itemsData.push(
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_001',
            itemName: 'ค่าแรงดันไฟฟ้าแบตเตอรี่ (หลัก) [เกณฑ์ ≥ 12.6V]',
            itemOrder: 1,
            hasNumeric: true,
            numericUnit: 'V',
            numericMin: 12.6,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_002',
            itemName: 'อายุขัยสุขภาพแบตเตอรี่ SOH (หลัก) [เกณฑ์ ≥ 80%]',
            itemOrder: 2,
            hasNumeric: true,
            numericUnit: '%',
            numericMin: 80,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_006',
            itemName: 'ค่ากระแสสตาร์ทเย็น CCA (หลัก) [เกณฑ์ ≥ 400A]',
            itemOrder: 3,
            hasNumeric: true,
            numericUnit: 'A',
            numericMin: 400,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_007',
            itemName: 'ค่าระดับพลังงาน SOC (หลัก) [เกณฑ์ = 100%]',
            itemOrder: 4,
            hasNumeric: true,
            numericUnit: '%',
            numericMin: 100,
            numericMax: 100,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_008',
            itemName: 'ตรวจสอบแรงดันลมยาง [เกณฑ์ 35 - 39 psi]',
            itemOrder: 5,
            hasNumeric: true,
            numericUnit: 'psi',
            numericMin: 35,
            numericMax: 39,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_005',
            itemName: 'ขั้วลบแบตเตอรี่ขันแน่นหนาและแข็งแรง',
            itemOrder: 6,
          }
        );
      } else {
        // Standard battery setup
        itemsData.push(
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_001',
            itemName: 'ค่าแรงดันไฟฟ้าแบตเตอรี่ (หลัก) [เกณฑ์ ≥ 12.6V]',
            itemOrder: 1,
            hasNumeric: true,
            numericUnit: 'V',
            numericMin: 12.6,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_002',
            itemName: 'อายุขัยสุขภาพแบตเตอรี่ SOH (หลัก) [เกณฑ์ ≥ 80%]',
            itemOrder: 2,
            hasNumeric: true,
            numericUnit: '%',
            numericMin: 80,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_005',
            itemName: 'ขั้วลบแบตเตอรี่ขันแน่นหนาและแข็งแรง',
            itemOrder: 3,
          }
        );
      }

      // Category 10: Warning Lights
      itemsData.push({
        category: 'ตรวจสอบไฟเตือน',
        categoryOrder: 10,
        itemCode: 'WRN_001',
        itemName: 'หน้าปัดรถยนต์ไม่มีไฟเตือนความผิดปกติแสดงค้าง',
        itemOrder: 1,
      });

      // Category 11: OTA (GAC M8 does not have OTA)
      if (modelCode !== 'GAC_M8') {
        itemsData.push(
          { category: 'วินิจฉัยและอัปเดตซอฟต์แวร์', categoryOrder: 11, itemCode: 'OTA_001', itemName: 'ตรวจสอบและทำการลบรหัสความผิดปกติ (DTC)', itemOrder: 1 },
          { category: 'วินิจฉัยและอัปเดตซอฟต์แวร์', categoryOrder: 11, itemCode: 'OTA_002', itemName: 'ตรวจสอบและอัปเดตเวอร์ชันซอฟต์แวร์หน้าจอกลาง', itemOrder: 2 }
        );
      }

      // Category 12: Charge Port Lock
      itemsData.push(
        { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_001', itemName: 'ทดสอบปลดล็อกฝาชาร์จด้วยกุญแจรีโมท', itemOrder: 1 },
        { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_002', itemName: 'ทดสอบปลดล็อกฝาชาร์จผ่านทางหน้าจอกลาง', itemOrder: 2 }
      );

      // Create Template
      await prisma.checklistTemplate.create({
        data: {
          modelCode,
          pdiType,
          version: '1.0',
          isActive: true,
          items: {
            create: itemsData.map((item) => ({
              category: item.category,
              categoryOrder: item.categoryOrder,
              itemCode: item.itemCode,
              itemName: item.itemName,
              itemOrder: item.itemOrder,
              isMandatory: item.isMandatory ?? true,
              hasPhoto: item.hasPhoto ?? false,
              hasNumeric: item.hasNumeric ?? false,
              numericUnit: item.numericUnit ?? null,
              numericMin: item.numericMin ?? null,
              numericMax: item.numericMax ?? null,
            })),
          },
        },
      });
    }
  }

  console.log('📝 Created checklist templates for all 7 models across 3 PDI types.');
  console.log('✅ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
