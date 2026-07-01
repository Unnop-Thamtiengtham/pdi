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
  const branchKJN = await prisma.branch.create({
    data: {
      code: 'KJN',
      name: 'Aion กาญจนาฯ',
      address: 'ถนนกาญจนาภิเษก กรุงเทพฯ',
    },
  });

  const branchLBD = await prisma.branch.create({
    data: {
      code: 'LBD',
      name: 'Aion เลียบด่วนฯ',
      address: 'ถนนประดิษฐ์มนูธรรม (เลียบด่วนรามอินทรา) กรุงเทพฯ',
    },
  });

  const branchPBL = await prisma.branch.create({
    data: {
      code: 'PBL',
      name: 'Aion พิบูลฯ',
      address: 'ถนนพิบูลสงคราม นนทบุรี',
    },
  });

  const branchMBR = await prisma.branch.create({
    data: {
      code: 'MBR',
      name: 'Aion มีนบุรี',
      address: '123 ถนนสุวินทวงศ์ มีนบุรี กรุงเทพฯ',
    },
  });

  const branchMHC = await prisma.branch.create({
    data: {
      code: 'MHC',
      name: 'Aion มหาชัย',
      address: 'ถนนพระราม 2 สมุทรสาคร',
    },
  });

  const branchSLY = await prisma.branch.create({
    data: {
      code: 'SLY',
      name: 'Aion ศาลายา',
      address: 'ถนนบรมราชชนนี นครปฐม',
    },
  });

  const branchAYT = await prisma.branch.create({
    data: {
      code: 'AYT',
      name: 'Aion อยุธยา',
      address: 'ถนนสายเอเชีย พระนครศรีอยุธยา',
    },
  });

  console.log('🏢 Created branches:', branchKJN.code, branchLBD.code, branchPBL.code, branchMBR.code, branchMHC.code, branchSLY.code, branchAYT.code);

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

  // 4. Create Vehicles
  const now = new Date();

  await prisma.vehicle.create({
    data: {
      vin: 'LNBSCCAK4RD100101',
      modelCode: 'AION_V',
      modelName: 'AION V Plus',
      colorCode: 'PW01',
      colorName: 'Pearl White',
      exteriorColor: 'ขาวมุก (Pearl White)',
      interiorColor: 'ดำ-เทา (Black-Grey)',
      productionYear: 2025,
      branchId: branchMBR.id,
      warehouse: 'คลัง A',
      floorplan: 'Zone 1',
      arrivedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      incomingDeadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      currentStatus: 'IN_STOCK',
    },
  });

  await prisma.vehicle.create({
    data: {
      vin: 'LNBSCCAK7RD200205',
      modelCode: 'AION_YP',
      modelName: 'AION Y Plus',
      colorCode: 'SG02',
      colorName: 'Starry Grey',
      exteriorColor: 'เทาดาว (Starry Grey)',
      interiorColor: 'ครีม-น้ำตาล (Cream-Brown)',
      productionYear: 2025,
      branchId: branchMBR.id,
      warehouse: 'คลัง A',
      floorplan: 'Zone 2',
      arrivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      incomingDeadline: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      currentStatus: 'IN_STOCK',
    },
  });

  await prisma.vehicle.create({
    data: {
      vin: 'LNBHHTCK3RD300310',
      modelCode: 'HYPTEC_HT',
      modelName: 'HYPTEC HT',
      colorCode: 'MB03',
      colorName: 'Midnight Blue',
      exteriorColor: 'น้ำเงินเข้ม (Midnight Blue)',
      interiorColor: 'ดำ-แดง (Black-Red)',
      productionYear: 2025,
      branchId: branchKJN.id,
      warehouse: 'คลัง B',
      floorplan: 'Zone 1',
      arrivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      incomingDeadline: new Date(now.getTime()),
      currentStatus: 'IN_STOCK',
    },
  });

  await prisma.vehicle.create({
    data: {
      vin: 'LNBSCCAK8RD200305',
      modelCode: 'AION_YP5',
      modelName: 'AION Y Plus 5',
      colorCode: 'BK01',
      colorName: 'Midnight Black',
      exteriorColor: 'ดำ (Midnight Black)',
      interiorColor: 'ดำ-ส้ม (Black-Orange)',
      productionYear: 2026,
      branchId: branchMBR.id,
      warehouse: 'คลัง C',
      floorplan: 'Zone A',
      arrivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      incomingDeadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      currentStatus: 'IN_STOCK',
    },
  });

  await prisma.vehicle.create({
    data: {
      vin: 'LNBSCCAK5RD100201',
      modelCode: 'AION_V5',
      modelName: 'AION V 5',
      colorCode: 'SL01',
      colorName: 'Sleek Silver',
      exteriorColor: 'เงิน (Sleek Silver)',
      interiorColor: 'เทา-ขาว (Grey-White)',
      productionYear: 2026,
      branchId: branchKJN.id,
      warehouse: 'คลัง B',
      floorplan: 'Zone 2',
      arrivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      incomingDeadline: new Date(now.getTime()),
      currentStatus: 'IN_STOCK',
    },
  });

  await prisma.vehicle.create({
    data: {
      vin: 'LNBSCCAK6RD100999',
      modelCode: 'AION_ES',
      modelName: 'AION ES',
      colorCode: 'PW02',
      colorName: 'Pearl White',
      exteriorColor: 'ขาวมุก (Pearl White)',
      interiorColor: 'ดำ (Black)',
      productionYear: 2025,
      branchId: branchLBD.id,
      warehouse: 'คลัง D',
      floorplan: 'Zone 1',
      arrivedAt: new Date(now.getTime()),
      incomingDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      currentStatus: 'IN_STOCK',
    },
  });

  console.log('🚗 Created 6 sample vehicles.');

  // 5. Create Checklist Templates for all models and all types
  const models = ['AION_V', 'AION_V5', 'AION_UT', 'AION_YP', 'AION_YP5', 'AION_ES', 'HYPTEC_HT', 'HYPTEC_SSR', 'GAC_M8'];
  const types = [PdiType.INCOMING, PdiType.LONG_TERM, PdiType.PRE_DELIVERY];

  for (const modelCode of models) {
    for (const pdiType of types) {
      const itemsData = [];

      if (pdiType === PdiType.LONG_TERM) {
        itemsData.push(
          // Category: ตรวจสอบเอกสารที่เกี่ยวข้องกับรถ (order 14)
          { category: 'ตรวจสอบเอกสารที่เกี่ยวข้องกับรถ', categoryOrder: 14, itemCode: 'LT_001', itemName: 'คู่มือการใช้, ฉลากผลิตภัณฑ์', itemOrder: 1 },

          // Category: ตรวจสอบสภาพรถภายนอกและภายใน (order 15)
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_002', itemName: 'ล้อแม็ก, ฝาครอบล้อ, ยาง, ความดันลมยาง', itemOrder: 1 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_003', itemName: 'กระจกหน้ารถ, กระจกหลังรถ, กระจกหน้าต่าง, กระจกหลังคาซันรูฟ', itemOrder: 2 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_004', itemName: 'สภาพไฟด้านนอกรถ', itemOrder: 3 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_005', itemName: 'สภาพฟิล์มป้องกันรถยนต์และความสะอาดของภายนอกรถ', itemOrder: 4 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_006', itemName: 'สีภายนอกรถยนต์', itemOrder: 5 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_007', itemName: 'กระจังหน้าและชิ้นส่วนชุบโลหะ', itemOrder: 6 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_008', itemName: 'สภาพยางรีดน้ำขอบกระจก', itemOrder: 7 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_009', itemName: 'สภาพชิ้นส่วนตกแต่งหลังคาด้านซ้ายและขวา', itemOrder: 8 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_010', itemName: 'สภาพเสาประตูโครเมียมและมือจับประตู', itemOrder: 9 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_011', itemName: 'ตรวจสอบสิ่งแปลกปลอมในรถ', itemOrder: 10 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_012', itemName: 'สภาพหลังคารถ', itemOrder: 11 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_013', itemName: 'สภาพพรม', itemOrder: 12 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_014', itemName: 'สภาพชายบันไดประตูรถ', itemOrder: 13 },
          { category: 'ตรวจสอบสภาพรถภายนอกและภายใน', categoryOrder: 15, itemCode: 'LT_015', itemName: 'สภาพยางขอบประตูทั้ง 4 บานและยางขอบประตูหลัง', itemOrder: 14 },

          // Category: ตรวจสอบการใช้งานและฟังก์ชัน (order 16)
          { category: 'ตรวจสอบการใช้งานและฟังก์ชัน', categoryOrder: 16, itemCode: 'LT_016', itemName: 'แรงดันไฟฟ้าของแบตเตอรี่ลูกเล็ก', itemOrder: 1 },
          { category: 'ตรวจสอบการใช้งานและฟังก์ชัน', categoryOrder: 16, itemCode: 'LT_017', itemName: 'แรงดันไฟฟ้าของแบตเตอรี่ขับเคลื่อน', itemOrder: 2 },
          { category: 'ตรวจสอบการใช้งานและฟังก์ชัน', categoryOrder: 16, itemCode: 'LT_018', itemName: 'สถานะระบบปรับอากาศ', itemOrder: 3 },

          // Category: ตรวจสอบห้องเครื่อง (order 17)
          { category: 'ตรวจสอบห้องเครื่อง', categoryOrder: 17, itemCode: 'LT_019', itemName: 'ท่อต่าง ๆ ในห้องเครื่อง สายไฟแรงดันสูงและต่ำ แคลมป์ น็อตยึด และชิ้นส่วนตกแต่ง', itemOrder: 1 },
          { category: 'ตรวจสอบห้องเครื่อง', categoryOrder: 17, itemCode: 'LT_020', itemName: 'ปริมาณน้ำหล่อเย็น (กล่องควบคุมแบตเตอรี่ และ PTC)', itemOrder: 2 },
          { category: 'ตรวจสอบห้องเครื่อง', categoryOrder: 17, itemCode: 'LT_021', itemName: 'ปริมาณน้ำมันเบรก', itemOrder: 3 },

          // Category: ตรวจสอบขณะรถเคลื่อนที่ (order 18)
          { category: 'ตรวจสอบขณะรถเคลื่อนที่', categoryOrder: 18, itemCode: 'LT_022', itemName: 'การแสดงผลบนหน้าจอ IC', itemOrder: 1 },
          { category: 'ตรวจสอบขณะรถเคลื่อนที่', categoryOrder: 18, itemCode: 'LT_023', itemName: 'ขณะรถเคลื่อนที่', itemOrder: 2 },

          // Category: สิ้นสุดการตรวจสอบ (order 19)
          { category: 'สิ้นสุดการตรวจสอบ', categoryOrder: 19, itemCode: 'LT_024', itemName: 'เสร็จสิ้นการตรวจสอบ', itemOrder: 1 }
        );
      } else {
        // Category 1: Exterior
        itemsData.push(
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_001', itemName: 'ประตู', itemOrder: 1 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_002', itemName: 'ฝากระโปรงหน้า/หลัง', itemOrder: 2 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_003', itemName: 'กันชนหน้า/หลัง', itemOrder: 3 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_004', itemName: 'แก้มบังโคลน', itemOrder: 4 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_005', itemName: 'กระจกมองข้าง', itemOrder: 5 },
        { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_006', itemName: 'อุปกรณ์ตกแต่งภายในห้องโดยสาร', itemOrder: 6 }
      );
      if (modelCode !== 'AION_V' && modelCode !== 'AION_V5') {
        itemsData.push(
          { category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_008', itemName: 'สเกิร์ตข้าง', itemOrder: 8 }
        );
      }

      // Model Rule: HYPTEC_HT has Gullwing Doors
      if (modelCode === 'HYPTEC_HT') {
        itemsData.push(
          {
            category: 'ลักษณะภายนอกและสี',
            categoryOrder: 1,
            itemCode: 'EXT_007',
            itemName: 'ฟังก์ชันประตูปีกนก (Gullwing Doors)',
            itemOrder: 7,
            isMandatory: true,
            hasPhoto: true,
          }
        );
      }

      // Category 2: Lighting
      if (modelCode === 'AION_YP' || modelCode === 'AION_YP5') {
        itemsData.push(
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_001', itemName: 'ระบบไฟเดไทม์ DRL', itemOrder: 1 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_002', itemName: 'ไฟหน้าต่ำ', itemOrder: 2 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_003', itemName: 'ไฟหน้าสูง', itemOrder: 3 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_004', itemName: 'ไฟเลี้ยว', itemOrder: 4 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_005', itemName: 'ไฟฉุกเฉิน', itemOrder: 5 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_006', itemName: 'ไฟตัดหมอกหน้า-หลัง', itemOrder: 6 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_007', itemName: 'ไฟเบรค', itemOrder: 7 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_008', itemName: 'ไฟถอย', itemOrder: 8 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_009', itemName: 'ไฟในห้องโดยสาร', itemOrder: 9 }
        );
      } else if (modelCode === 'AION_V' || modelCode === 'AION_V5' || modelCode === 'AION_UT') {
        itemsData.push(
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_001', itemName: 'ไฟหน้า', itemOrder: 1 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_002', itemName: 'ไฟท้าย', itemOrder: 2 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_003', itemName: 'ไฟเลี้ยวและไฟฉุกเฉิน', itemOrder: 3 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_004', itemName: 'ไฟ DRL (Daytime Running Light)', itemOrder: 4 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_005', itemName: 'ไฟส่องป้ายทะเบียน', itemOrder: 5 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_006', itemName: 'ไฟถอยหลัง', itemOrder: 6 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_007', itemName: 'ไฟตัดหมอกหน้า-หลัง (Fog Light)', itemOrder: 7 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_008', itemName: 'ไฟในห้องโดยสาร', itemOrder: 8 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_009', itemName: 'ไฟอ่านหนังสือ (Reading Light)', itemOrder: 9 }
        );
      } else if (modelCode === 'HYPTEC_HT') {
        itemsData.push(
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_001', itemName: 'ไฟหน้า', itemOrder: 1 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_002', itemName: 'ไฟท้าย', itemOrder: 2 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_003', itemName: 'ไฟเลี้ยวและไฟฉุกเฉิน', itemOrder: 3 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_004', itemName: 'ไฟ DRL (Daytime Running Light)', itemOrder: 4 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_005', itemName: 'ไฟส่องป้ายทะเบียน', itemOrder: 5 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_006', itemName: 'ไฟถอยหลัง', itemOrder: 6 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_007', itemName: 'ไฟตัดหมอกหน้า-หลัง (Fog Light)', itemOrder: 7 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_008', itemName: 'ไฟในห้องโดยสาร', itemOrder: 8 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_009', itemName: 'ไฟอเนกประสงค์ด้านหลัง A', itemOrder: 9 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_010', itemName: 'ไฟอเนกประสงค์ด้านหลัง B', itemOrder: 10 }
        );
      } else {
        itemsData.push(
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_001', itemName: 'ไฟหน้า', itemOrder: 1 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_002', itemName: 'ไฟท้าย', itemOrder: 2 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_003', itemName: 'ไฟเลี้ยวและไฟฉุกเฉิน', itemOrder: 3 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_004', itemName: 'ไฟ DRL (Daytime Running Light)', itemOrder: 4 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_005', itemName: 'ไฟส่องป้ายทะเบียน', itemOrder: 5 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_006', itemName: 'ไฟถอยหลัง', itemOrder: 6 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_007', itemName: 'ไฟหน้าต่ำ (Low Beam)', itemOrder: 7 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_008', itemName: 'ไฟหน้าสูง (High Beam)', itemOrder: 8 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_009', itemName: 'ไฟตัดหมอกหน้า-หลัง (Fog Light)', itemOrder: 9 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_010', itemName: 'ไฟเบรก', itemOrder: 10 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_011', itemName: 'ไฟในห้องโดยสาร', itemOrder: 11 },
          { category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_012', itemName: 'ไฟอ่านหนังสือ (Reading Light)', itemOrder: 12 }
        );
      }

      // Category 3: Glass & Wipers
      if (modelCode === 'AION_UT') {
        itemsData.push(
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_001', itemName: 'ระบบปรับกระจกไฟฟ้า / ระบบกันหนีบ', itemOrder: 1 },
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_002', itemName: 'การทำงานของที่ปัดน้ำฝนหน้า', itemOrder: 2 },
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_003', itemName: 'ฟังก์ชันฉีดน้ำทำความสะอาดกระจก', itemOrder: 3 },
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_004', itemName: 'ฟังก์ชันม่านบังแดด (Sun Shade)', itemOrder: 4 }
        );
      } else {
        itemsData.push(
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_001', itemName: 'ระบบปรับกระจกไฟฟ้า / ระบบกันหนีบ', itemOrder: 1 },
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_002', itemName: 'การทำงานของที่ปัดน้ำฝนหน้า', itemOrder: 2 },
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_003', itemName: 'ฟังก์ชันฉีดน้ำทำความสะอาดกระจก', itemOrder: 3 },
          { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_004', itemName: 'การทำงานของ Sunroof', itemOrder: 4 }
        );
        if (modelCode !== 'AION_YP' && modelCode !== 'AION_YP5') {
          itemsData.push(
            { category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_005', itemName: 'ฟังก์ชันม่านบังแดด (Sun Shade)', itemOrder: 5 }
          );
        }
      }

      // Category 4: AC
      itemsData.push(
        { category: 'ระบบปรับอากาศ', categoryOrder: 4, itemCode: 'AC_001', itemName: 'การทำความเย็นและความร้อน', itemOrder: 1 },
        { category: 'ระบบปรับอากาศ', categoryOrder: 4, itemCode: 'AC_002', itemName: 'การปรับความแรงลมและทิศทางลม', itemOrder: 2 }
      );

      // Category 5: Infotainment
      itemsData.push(
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_001', itemName: 'กล้องมองภาพรอบทิศทาง 360 องศา', itemOrder: 1 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_002', itemName: 'ระบบเสียงและลำโพง', itemOrder: 2 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_003', itemName: 'ฟังก์ชันเชื่อมต่อบลูทูธและโทรศัพท์', itemOrder: 3 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_004', itemName: 'ระบบนำทาง (Navigation)', itemOrder: 4 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_005', itemName: 'ฟังก์ชันอินเตอร์เน็ตและเครือข่าย', itemOrder: 5 },
        { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_006', itemName: 'ระบบสั่งงานด้วยเสียง (Voice Control)', itemOrder: 6 }
      );
      if (modelCode !== 'AION_V' && modelCode !== 'AION_V5' && modelCode !== 'AION_UT') {
        itemsData.push(
          { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_007', itemName: 'ระบบชาร์จมือถือไร้สาย (Wireless Charging)', itemOrder: 7 }
        );
      }
      if (modelCode === 'AION_V' || modelCode === 'AION_V5' || modelCode === 'AION_UT') {
        itemsData.push(
          { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_007', itemName: 'ฟังก์ชันความบันเทิง (Entertainment System)', itemOrder: 7 }
        );
      } else if (modelCode !== 'AION_YP' && modelCode !== 'AION_YP5') {
        itemsData.push(
          { category: 'ระบบความบันเทิง', categoryOrder: 5, itemCode: 'ENT_008', itemName: 'ฟังก์ชันความบันเทิง (Entertainment System)', itemOrder: 8 }
        );
      }

      // Category 6: Fluids
      itemsData.push(
        { category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_001', itemName: 'ระดับน้ำยาหล่อเย็นอินเวอร์เตอร์/มอเตอร์', itemOrder: 1 },
        { category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_002', itemName: 'ระดับน้ำมันเบรก', itemOrder: 2 },
        { category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_003', itemName: 'ระดับน้ำฉีดกระจก', itemOrder: 3 }
      );

      // Category 7: Chassis
      if (modelCode === 'AION_YP' || modelCode === 'AION_YP5' || modelCode === 'AION_V' || modelCode === 'AION_V5') {
        itemsData.push(
          { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_001', itemName: 'ลักษณะภายนอกของชุดแบตเตอรี่แรงดันสูง (HV Battery)', itemOrder: 1, hasPhoto: true, hasNumeric: true, numericUnit: '%', numericMin: 50 }
        );
      } else {
        itemsData.push(
          { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_001', itemName: 'ลักษณะภายนอกของชุดแบตเตอรี่แรงดันสูง (HV Battery)', itemOrder: 1, hasPhoto: true }
        );
      }
      itemsData.push(
        { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_002', itemName: 'ท่อส่งน้ำยาหล่อเย็นแบตเตอรี่และการรั่วซึม', itemOrder: 2 },
        { category: 'ระบบช่วงล่าง', categoryOrder: 7, itemCode: 'CHS_003', itemName: 'การขันยึดน็อตและโครงสร้างช่วงล่าง', itemOrder: 3 }
      );

      // Category 8: Brake
      if (modelCode === 'AION_V' || modelCode === 'AION_V5') {
        itemsData.push(
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_001', itemName: 'ฟังก์ชันห้ามล้อและเบรกมือไฟฟ้า', itemOrder: 1 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_002', itemName: 'การตอบสนองของพวงมาลัยและการเลี้ยว', itemOrder: 2 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_003', itemName: 'ประสิทธิภาพการเบรก (Brake Performance)', itemOrder: 3 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_004', itemName: 'ทดสอบขับ (Test Drive)', itemOrder: 4 }
        );
      } else {
        itemsData.push(
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_001', itemName: 'ฟังก์ชันห้ามล้อและเบรกมือไฟฟ้า', itemOrder: 1 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_002', itemName: 'การตอบสนองของพวงมาลัยและการเลี้ยว', itemOrder: 2 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_003', itemName: 'ตรวจสอบเบรกสุญญากาศและหมอดเบรก', itemOrder: 3 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_004', itemName: 'ประสิทธิภาพการเบรก (Brake Performance)', itemOrder: 4 },
          { category: 'การเบรกและการบังคับเลี้ยว', categoryOrder: 8, itemCode: 'BRK_005', itemName: 'ทดสอบขับ (Test Drive)', itemOrder: 5 }
        );
      }

      // Category 9: Battery 12V (Model-Specific Battery Test Rules)
      if (modelCode === 'AION_V' || modelCode === 'AION_V5' || modelCode === 'HYPTEC_HT') {
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
      } else if (modelCode === 'AION_YP' || modelCode === 'AION_YP5') {
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
      } else if (modelCode === 'AION_UT') {
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
            itemName: 'ขั้วลบแบตเตอรี่ขันแน่และไม่หลุดหลวม',
            itemOrder: 3,
          },
          {
            category: 'ตรวจสอบแบตเตอรี่ 12V',
            categoryOrder: 9,
            itemCode: 'BAT_004',
            itemName: 'ระดับแบตเตอรี่ HV [เกณฑ์ ≥ 0%]',
            itemOrder: 4,
            hasNumeric: true,
            numericUnit: '%',
            numericMin: 0,
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
      if (modelCode === 'AION_V' || modelCode === 'AION_V5') {
        itemsData.push(
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_001', itemName: 'ทดสอบปลดล็อกฝาชาร์จด้วยกุญแจรีโมท', itemOrder: 1 },
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_002', itemName: 'ทดสอบปลดล็อกฝาชาร์จผ่านทางหน้าจอกลาง', itemOrder: 2 },
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_003', itemName: 'ปุ่มฝาปิดช่องชาร์จ', itemOrder: 3 }
        );
      } else {
        itemsData.push(
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_001', itemName: 'ทดสอบปลดล็อกฝาชาร์จด้วยกุญแจรีโมท', itemOrder: 1 },
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_002', itemName: 'ทดสอบปลดล็อกฝาชาร์จผ่านทางหน้าจอกลาง', itemOrder: 2 },
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_003', itemName: 'สวิตช์ชาร์จไฟ', itemOrder: 3 },
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_004', itemName: 'สายปลดล็อกฉุกเฉิน (Emergency Release)', itemOrder: 4 },
          { category: 'การปลดล็อกฝาปิดช่องชาร์จ', categoryOrder: 12, itemCode: 'CHG_005', itemName: 'ปลดล็อกด้วยแอปพลิเคชัน (App Unlock)', itemOrder: 5 }
        );
      }

      }

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

  console.log('📝 Created checklist templates for all 9 models across 3 PDI types.');
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
