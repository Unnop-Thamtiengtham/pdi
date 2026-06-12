// ──────────────────────────────────────
// MODEL CODES — รุ่นรถที่รองรับ
// ──────────────────────────────────────
export type ModelCode =
  | 'AION_V'
  | 'AION_UT'
  | 'AION_YP'
  | 'AION_ES'
  | 'HYPTEC_HT'
  | 'HYPTEC_SSR'
  | 'GAC_M8'

export const MODEL_NAMES: Record<ModelCode, string> = {
  AION_V: 'AION V',
  AION_UT: 'AION UT',
  AION_YP: 'AION Y Plus',
  AION_ES: 'AION ES',
  HYPTEC_HT: 'HYPTEC HT',
  HYPTEC_SSR: 'HYPTEC SSR',
  GAC_M8: 'GAC M8',
}

// ──────────────────────────────────────
// CHECKLIST CATEGORIES (ทุกรุ่นมีครบ ยกเว้นที่ mark NA)
// ──────────────────────────────────────
export const CHECKLIST_CATEGORIES = [
  { code: 'EXTERIOR',    name: 'ลักษณะภายนอกและสี',           order: 1 },
  { code: 'LIGHTING',    name: 'ไฟส่องสว่าง',                  order: 2 },
  { code: 'GLASS',       name: 'กระจกและที่ปัดน้ำฝน',          order: 3 },
  { code: 'AC',          name: 'ระบบปรับอากาศ',                order: 4 },
  { code: 'INFOTAINMENT',name: 'ระบบความบันเทิง',              order: 5 },
  { code: 'FLUIDS',      name: 'ตรวจสอบระดับของเหลว',          order: 6 },
  { code: 'CHASSIS',     name: 'ระบบช่วงล่าง',                 order: 7 },
  { code: 'BRAKE',       name: 'การเบรกและการบังคับเลี้ยว',    order: 8 },
  { code: 'BATTERY_12V', name: 'ตรวจสอบแบตเตอรี่ 12V',         order: 9 },
  { code: 'WARNING',     name: 'ตรวจสอบไฟเตือน',               order: 10 },
  { code: 'OTA',         name: 'วินิจฉัยและอัปเดตซอฟต์แวร์',   order: 11 },
  { code: 'CHARGEPORT',  name: 'การปลดล็อกฝาปิดช่องชาร์จ',    order: 12 },
] as const

// ──────────────────────────────────────
// MODEL-SPECIFIC RULES
// ──────────────────────────────────────
export interface ModelRuleSet {
  hasDualBattery: boolean    // AION V และ HYPTEC HT
  hasCCA: boolean            // AION YP: ต้องเก็บ CCA ≥ 400A
  hasSocCheck: boolean       // AION YP: SOC = 100%
  hasTirePressure: boolean   // AION YP: 35-39 psi
  hasGullwingDoor: boolean   // HYPTEC HT: ประตูปีกนก
  hasOTA: boolean            // GAC M8 PHEV ไม่มี OTA
  hasPhev: boolean           // GAC M8
  hvBatteryMin: number       // % ขั้นต่ำ HV battery
}

export const MODEL_RULES: Record<ModelCode, ModelRuleSet> = {
  AION_V:      { hasDualBattery: true,  hasCCA: false, hasSocCheck: false, hasTirePressure: false, hasGullwingDoor: false, hasOTA: true,  hasPhev: false, hvBatteryMin: 0   },
  AION_UT:     { hasDualBattery: false, hasCCA: false, hasSocCheck: false, hasTirePressure: false, hasGullwingDoor: false, hasOTA: true,  hasPhev: false, hvBatteryMin: 0   },
  AION_YP:     { hasDualBattery: false, hasCCA: true,  hasSocCheck: true,  hasTirePressure: true,  hasGullwingDoor: false, hasOTA: true,  hasPhev: false, hvBatteryMin: 50  },
  AION_ES:     { hasDualBattery: false, hasCCA: false, hasSocCheck: false, hasTirePressure: false, hasGullwingDoor: false, hasOTA: true,  hasPhev: false, hvBatteryMin: 0   },
  HYPTEC_HT:   { hasDualBattery: true,  hasCCA: false, hasSocCheck: false, hasTirePressure: false, hasGullwingDoor: true,  hasOTA: true,  hasPhev: false, hvBatteryMin: 0   },
  HYPTEC_SSR:  { hasDualBattery: false, hasCCA: false, hasSocCheck: false, hasTirePressure: false, hasGullwingDoor: false, hasOTA: true,  hasPhev: false, hvBatteryMin: 0   },
  GAC_M8:      { hasDualBattery: false, hasCCA: false, hasSocCheck: false, hasTirePressure: false, hasGullwingDoor: false, hasOTA: false, hasPhev: true,  hvBatteryMin: 0   },
}

// ──────────────────────────────────────
// BATTERY THRESHOLDS
// ──────────────────────────────────────
export const BATTERY_THRESHOLDS = {
  voltageMin: 12.6,   // V
  sohMin: 80,         // %
  ccaMin: 400,        // A (AION YP)
  socTarget: 100,     // % (AION YP)
  tirePressureMin: 35,// psi (AION YP)
  tirePressureMax: 39,// psi (AION YP)
} as const

// ──────────────────────────────────────
// SLA CONFIG
// ──────────────────────────────────────
export const SLA_CONFIG = {
  incomingHours: 24,               // ชม. หลังรับรถ
  ltmIntervals: [30, 60, 90],      // วัน
  preDeliverySubmitDays: 3,        // วันทำการหลังแจ้ง key ขาย
} as const

// ──────────────────────────────────────
// DOCUMENTS REQUIRED ต่อ PDI Type
// ──────────────────────────────────────
export const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  INCOMING: ['PDI_CHECKLIST', 'BATTERY_REPORT', 'VEHICLE_REPORT'],
  LONG_TERM: ['PDI_CHECKLIST', 'BATTERY_REPORT'],
  PRE_DELIVERY: ['PDI_CHECKLIST', 'BATTERY_REPORT', 'VEHICLE_REPORT', 'DELIVERY_FORM', 'PDPA_CONSENT'],
}
