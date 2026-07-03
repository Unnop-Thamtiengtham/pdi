import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncEntItems() {
  console.log('🔄 Syncing ENT items wording for AION_V and AION_V5 templates in PostgreSQL...');

  const models = ['AION_V', 'AION_V5'];
  const newNames: Record<string, string> = {
    ENT_001: 'การทำงานของกล้องมองภาพรอบทิศทาง',
    ENT_002: 'การทำงานของระบบเครื่องเสียง',
    ENT_003: 'ฟังก์ชันอินเทอร์เน็ตและเครือข่าย',
    ENT_004: 'การทำงานระบบสั่งงานด้วยเสียง',
    ENT_005: 'การทำงานของระบบบลูทูธ (Bluetooth)',
    ENT_006: 'ฟังก์ชันการนำทาง',
    ENT_007: 'ฟังก์ชันความบันเทิง',
  };

  for (const modelCode of models) {
    const templates = await prisma.checklistTemplate.findMany({
      where: { modelCode, isActive: true },
    });

    for (const tmpl of templates) {
      for (const [code, name] of Object.entries(newNames)) {
        await prisma.checklistItem.updateMany({
          where: {
            templateId: tmpl.id,
            itemCode: code,
          },
          data: {
            itemName: name,
          },
        });
        console.log(`✏️ Updated ${code} to "${name}" for ${modelCode} (${tmpl.pdiType})`);
      }
    }
  }

  console.log('✅ ENT checklist items updated successfully!');
}

syncEntItems()
  .catch(e => { console.error('❌ Error updating items:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
