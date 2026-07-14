'use client';

import React from 'react';
import { CHECKLIST_CATEGORIES, BATTERY_THRESHOLDS, MODEL_RULES, ModelCode } from '@/types/pdi';

interface PdiPrintReportProps {
  job: any;
  templateItems: any[];
  signatures?: {
    customer: string | null;
    inspector: string | null;
    supervisor: string | null;
  };
}

export default function PdiPrintReport({ job, templateItems, signatures }: PdiPrintReportProps) {
  if (!job) return null;

  // ── Data processing ─────────────────────────────────────
  const resultsMap: Record<string, any> = {};
  (job.checklistItems || []).forEach((r: any) => {
    resultsMap[r.itemId] = r;
  });

  const getResultSymbol = (itemId: string, itemCode: string) => {
    let resultObj = resultsMap[itemId];
    if (!resultObj && itemCode) {
      resultObj = Object.values(resultsMap).find((r: any) => r.itemCode === itemCode);
    }
    if (!resultObj) return '✓'; 

    const res = resultObj.result;
    if (res === 'PASS') return '✓';
    if (res === 'FAIL') return '✗';
    if (res === 'REPAIRED') return 'o';
    if (res === 'NA') return '-';
    return '✓';
  };

  const getFallbackName = (code: string) => {
    const map: Record<string, string> = {
      // Exterior
      EXT_001: 'ประตู',
      EXT_002: 'ฝากระโปรงหน้า/หลัง',
      EXT_003: 'โป่งหลัง',
      EXT_004: 'กันชนหน้าและกันชนหลัง',
      EXT_005: 'สเกิร์ตข้าง',
      EXT_006: 'บังโคลนล้อแม็ก',
      EXT_007: 'รูปลักษณ์ภายใน',
      // Lighting
      LGT_001: 'ระบบไฟ DRL / ไฟหรี่',
      LGT_002: 'ไฟหน้าต่ำ',
      LGT_003: 'ไฟหน้าสูง',
      LGT_004: 'ไฟฉุกเฉิน',
      LGT_005: 'ไฟตัดหมอกหน้า-หลัง',
      LGT_006: 'ไฟเบรก',
      LGT_007: 'ไฟถอย',
      LGT_008: 'ไฟเลี้ยว',
      LGT_009: 'ไฟภายในห้องโดยสาร',
      // Fluids
      FLD_001: 'น้ำยาหล่อเย็น',
      FLD_002: 'น้ำมันเบรก',
      FLD_003: 'น้ำยาทำความสะอาดกระจก',
      // Glass
      GLS_001: 'กระจกทำงานปกติ/ระบบกันหนีบ',
      GLS_002: 'การทำงานของที่ปัดน้ำฝน',
      GLS_003: 'การทำงานของที่ฉีดกระจก',
      GLS_004: 'ซันรูฟ / ม่านบังแดด',
      // AC
      AC_001: 'ทดสอบการทำความเย็นและความร้อน',
      AC_002: 'ทิศทางลมตามหน้าจอรถ',
      // Infotainment
      ENT_001: 'ฟังก์ชันการนำทาง',
      ENT_002: 'การทำงานของระบบเครื่องเสียง',
      ENT_003: 'การทำงานของระบบบลูทูธ (Bluetooth)',
      ENT_004: 'ฟังก์ชันอินเทอร์เน็ตและเครือข่าย',
      ENT_005: 'การทำงานระบบสั่งงานด้วยเสียง',
      ENT_006: 'การทำงานระบบชาร์จมือถือไร้สาย',
      ENT_007: 'การทำงานของระบบกล้องรอบคัน',
      // Chassis
      CHS_001: 'ระดับไฟแบตเตอรี่มากกว่า 50%',
      CHS_002: 'จุดเชื่อมต่อของท่อต่างๆ',
      CHS_003: 'การขันยึดน็อต/สกรูในตำแหน่งสำคัญ เช่น ขั้วแบตเตอรี่ 12V',
      // Brakes
      BRK_001: 'การทำงานของระบบเบรก',
      BRK_002: 'การทำงานของปั๊มเบรกสุญญากาศ/หม้อลมเบรก',
      BRK_003: 'การทำงานของพวงมาลัย ไม่กินซ้ายหรือกินขวา',
      // Charging
      CHG_001: 'ปุ่มปลดล็อกบนรีโมท',
      CHG_002: 'สวิตช์ชาร์จไฟ',
      CHG_003: 'สายเคเบิลปลดล็อกฉุกเฉิน',
    };
    return map[code] || code;
  };

  const battery = job.batteryTestResult || {};
  const modelCode = job.vehicle?.modelCode;
  const isHyptec = modelCode === 'HYPTEC_HT' || modelCode === 'HYPTEC_HT8' || modelCode?.startsWith('HYPTEC');
  const isAionV = modelCode === 'AION_V' || modelCode === 'AION_V5' || modelCode?.includes('_V');
  const isAionUt = modelCode === 'AION_UT' || modelCode?.includes('_UT');
  const isAionEs = modelCode === 'AION_ES';
  const carImage = isHyptec 
    ? '/images/hyptec_ht_wireframe.png' 
    : isAionV 
      ? '/images/aion_v_wireframe.png' 
      : isAionUt
        ? '/images/aion_ut_wireframe_clean.png'
        : isAionEs
          ? '/images/aion_es_wireframe.png'
          : '/images/aion_yp_wireframe.png';

  const batteryVoltage = battery.mainVoltage !== undefined && battery.mainVoltage !== null ? `${battery.mainVoltage} V` : '_______ V';
  const batterySoh = battery.mainSoh !== undefined && battery.mainSoh !== null ? `${battery.mainSoh} %` : '_______ %';
  const batterySoc = battery.mainSoc !== undefined && battery.mainSoc !== null ? `${battery.mainSoc} %` : '_______ %';
  const batteryCca = battery.mainCca !== undefined && battery.mainCca !== null ? `${battery.mainCca} A` : '_______ A';
  const tirePressure = battery.tirePressure !== undefined && battery.tirePressure !== null ? `${battery.tirePressure} psi` : '_______ psi';

  // Check which battery parameters are configured in this model's checklist template using MODEL_RULES
  const rules = MODEL_RULES[modelCode as ModelCode] || {
    hasDualBattery: false,
    hasCCA: false,
    hasSocCheck: false,
    hasTirePressure: false,
  };
  const hasVoltage = templateItems.some(i => i.itemCode === 'BAT_001');
  const hasSoh = templateItems.some(i => i.itemCode === 'BAT_002');
  const hasSubVoltage = rules.hasDualBattery && templateItems.some(i => i.itemCode === 'BAT_003' && i.hasNumeric);
  const hasSubSoh = rules.hasDualBattery && templateItems.some(i => i.itemCode === 'BAT_004' && i.hasNumeric);
  const hasCca = rules.hasCCA && templateItems.some(i => i.itemCode === 'BAT_006' && i.hasNumeric);
  const hasSoc = rules.hasSocCheck && templateItems.some(i => i.itemCode === 'BAT_007');
  const hasTirePressure = rules.hasTirePressure && templateItems.some(i => i.itemCode === 'BAT_008');

  const nonNumericBatteryItems = templateItems.filter(
    i => (i.category === 'ตรวจสอบแบตเตอรี่ 12V' || i.category.includes('แบตเตอรี่')) && !i.hasNumeric
  );

  // Dynamic header logic based on job.pdiType
  let reportTitle = `แบบฟอร์มตรวจสอบ PDI รับรถใหม่ รุ่น ${job.vehicle?.modelName || 'AION YP'}`;
  
  let labelCol1 = "ชื่อผู้จำหน่าย";
  let valCol1 = job.salesName || '-';
  let labelCol3 = "วันที่รับรถ";
  let valCol3 = job.targetDeliveryDate ? new Date(job.targetDeliveryDate).toLocaleDateString('th-TH') : '-';

  let labelCol4 = "วันที่เข้าสต๊อก";
  let valCol4 = job.vehicle?.arrivedAt ? new Date(job.vehicle.arrivedAt).toLocaleDateString('th-TH') : '-';
  let labelCol5 = "วันที่ตรวจสอบ";
  let valCol5 = job.completedAt ? new Date(job.completedAt).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH');

  if (job.pdiType === 'INCOMING') {
    reportTitle = `แบบฟอร์มตรวจสอบรับรถยนต์ไฟฟ้า (Incoming PDI) รุ่น ${job.vehicle?.modelName || 'AION YP'}`;
    labelCol1 = "ผู้บันทึก";
    valCol1 = job.inspector?.name || '-';
    labelCol3 = "วันที่รถมาถึง";
    valCol3 = job.vehicle?.arrivedAt ? new Date(job.vehicle.arrivedAt).toLocaleDateString('th-TH') : '-';
    labelCol4 = "กำหนดส่ง SLA (24h)";
    valCol4 = job.vehicle?.incomingDeadline ? new Date(job.vehicle.incomingDeadline).toLocaleDateString('th-TH') : '-';
  } else if (job.pdiType === 'LONG_TERM') {
    reportTitle = `แบบฟอร์มตรวจสอบบำรุงรักษารถค้างสต๊อก (Long-term Maintenance) รุ่น ${job.vehicle?.modelName || 'AION YP'}`;
    labelCol1 = "รอบการตรวจ";
    valCol1 = job.ltmInterval ? `${job.ltmInterval} วัน` : '-';
    labelCol3 = "วันที่กำหนดตรวจ";
    valCol3 = job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('th-TH') : '-';
    labelCol4 = "วันที่เข้าสต๊อก";
    valCol4 = job.vehicle?.arrivedAt ? new Date(job.vehicle.arrivedAt).toLocaleDateString('th-TH') : '-';
  }

  // ── Render Helpers ──────────────────────────────────────
  const renderCategoryBox = (title: string, codes: string[]) => {
    const activeCodes = codes.filter(code => templateItems.some(i => i.itemCode === code));
    if (activeCodes.length === 0) {
      return (
        <div className="border border-slate-400 rounded-lg p-2 bg-white flex flex-col justify-center items-center flex-1 min-h-[45px]">
          <span className="text-[8px] text-slate-400 font-medium">— ไม่มีรายการตรวจ {title} —</span>
        </div>
      );
    }
    return (
      <div className="border border-slate-400 rounded-lg p-2 bg-white flex flex-col justify-between flex-1">
        <div>
          <div className="text-center font-bold border-b border-slate-200 pb-1 text-[10px] text-slate-800 mb-1">{title}</div>
          <table className="w-full text-[9px] border-collapse">
            <tbody>
              {activeCodes.map(code => {
                const item = templateItems.find(i => i.itemCode === code);
                const itemName = item ? item.itemName.replace('*', '') : getFallbackName(code);
                const itemId = item ? item.id : '';
                const symbol = itemId ? getResultSymbol(itemId, code) : '-';
                return (
                  <tr key={code} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-1 pr-1 text-slate-700 font-medium leading-tight">{itemName}</td>
                    <td className="w-6 py-0.5 border border-slate-300 text-center font-bold text-[10px] bg-slate-50/50">
                      {symbol}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const AionLogo = () => (
    <svg className="h-6" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L1 18H5L7 14H13L15 18H19L10 2ZM10 8L12 12H8L10 8Z" fill="#00A2C9" />
      <rect x="23" y="2" width="4" height="16" fill="#00A2C9" />
      <path d="M37 2C32.5817 2 29 5.58172 29 10C29 14.4183 32.5817 18 37 18C41.4183 18 45 14.4183 45 10C45 5.58172 41.4183 2 37 2ZM37 14C34.7909 14 33 12.2091 33 10C33 7.79086 34.7909 6 37 6C39.2091 6 41 7.79086 41 10C41 12.2091 39.2091 14 37 14Z" fill="#00A2C9" />
      <path d="M49 18V2H53L59 13V2H63V18H59L53 7V18H49Z" fill="#00A2C9" />
    </svg>
  );

  return (
    <div className="hidden print:block bg-white text-slate-800 p-0 font-sans print:p-0">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            body {
              background-color: white !important;
              color: #1e293b !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print-page-a4-yp {
              width: 210mm !important;
              height: 296mm !important;
              padding: 6mm 8mm 6mm 8mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              overflow: hidden !important;
            }
          }
        `}} />

        <div className="print-page-a4-yp flex flex-col justify-between h-[296mm] w-[210mm] mx-auto text-slate-800 text-[9px] leading-tight">
          
          {/* Header Block with single border */}
          <div className="border border-slate-900 p-1.5 space-y-1.5">
            {/* Logo & Title Row */}
            <div className="flex justify-between items-center border-b border-slate-400 pb-1.5">
              <div className="flex items-center gap-1">
                <AionLogo />
              </div>
              <div className="text-center flex-grow">
                <h2 className="text-xs font-bold text-slate-900 text-center tracking-wide pr-10">
                  แบบฟอร์มตรวจสอบ PDI รับรถใหม่ รุ่น {job.vehicle?.modelName || 'AION YP'}
                </h2>
              </div>
              <div className="text-right text-[8px] font-mono text-slate-500 whitespace-nowrap">
                เลขใบงาน: {job.jobNumber}
              </div>
            </div>

            {/* Metadata Table exact layout */}
            <table className="w-full border-collapse border border-slate-900 text-[8.5px]">
              <tbody>
                <tr>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold w-[12%] text-slate-700">รุ่นรถ</td>
                  <td className="border border-slate-900 px-2 py-0.5 w-[20%] font-semibold">{job.vehicle?.modelName || 'AION Y Plus'}</td>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold w-[10%] text-slate-700">VIN</td>
                  <td className="border border-slate-900 px-2 py-0.5 w-[28%] font-mono font-semibold select-all">{job.vehicleVin}</td>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold w-[15%] text-slate-700">หมายเลขมอเตอร์</td>
                  <td className="border border-slate-900 px-2 py-0.5 w-[15%] font-mono select-all">{job.vehicle?.motorBatteryNumber || '-'}</td>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold w-[12%] text-slate-700">วันที่รับรถ</td>
                  <td className="border border-slate-900 px-2 py-0.5 w-[18%]">{valCol3}</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold text-slate-700">ชื่อผู้จำหน่าย</td>
                  <td className="border border-slate-900 px-2 py-0.5">{valCol1}</td>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold text-slate-700">สีตัวถังรถ</td>
                  <td className="border border-slate-900 px-2 py-0.5">{job.vehicle?.colorName || job.vehicle?.exteriorColor || '-'}</td>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold text-slate-700">วันที่รับเข้าสต็อก</td>
                  <td className="border border-slate-900 px-2 py-0.5">{valCol4}</td>
                  <td className="border border-slate-900 px-2 py-0.5 bg-slate-50 font-bold text-slate-700">วันที่ตรวจสอบ</td>
                  <td className="border border-slate-900 px-2 py-0.5">{valCol5}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Blue Legend Bar */}
          <div className="bg-[#00A2C9] text-white text-center py-0.5 px-3 rounded font-bold text-[8.5px] flex justify-center gap-6 mt-1">
            <span>ผลการตรวจสอบ จะต้องระบุตามนี้ :</span>
            <span>ปกติ ✓</span>
            <span>ผิดปกติ ✗</span>
            <span>แก้ไขแล้ว o</span>
            <span>- ไม่มีในรถรุ่นนี้</span>
          </div>

          {/* Main 3 columns: Left (Exterior, Lights) - Center (Image) - Right (Glass, AC, Infotainment) */}
          <div className="flex justify-between items-stretch my-1 flex-grow w-full">
            {/* Left column (w-[66mm]) */}
            <div className="w-[66mm] flex-shrink-0 flex flex-col justify-between space-y-1.5 h-full">
              {renderCategoryBox('ตัวสีภายนอก', ['EXT_001', 'EXT_002', 'EXT_003', 'EXT_004', 'EXT_005', 'EXT_006', 'EXT_007'])}
              {renderCategoryBox('ระบบไฟส่องสว่าง', ['LGT_001', 'LGT_002', 'LGT_003', 'LGT_004', 'LGT_005', 'LGT_006', 'LGT_007', 'LGT_008', 'LGT_009'])}
            </div>

            {/* Center column (w-[62mm]) */}
            <div className="w-[62mm] flex-shrink-0 flex justify-center items-center h-full overflow-hidden pt-12">
              <img 
                src={carImage} 
                alt="Car Diagram" 
                className="w-full h-full object-fill opacity-95 mix-blend-multiply" 
              />
            </div>

            {/* Right column (w-[66mm]) */}
            <div className="w-[66mm] flex-shrink-0 flex flex-col justify-between space-y-1.5 h-full">
              {renderCategoryBox('กระจกหน้ารถและที่ปัดน้ำฝน', ['GLS_001', 'GLS_002', 'GLS_003', 'GLS_004'])}
              {renderCategoryBox('ระบบปรับอากาศ', ['AC_001', 'AC_002'])}
              {renderCategoryBox('ระบบความบันเทิง', ['ENT_001', 'ENT_002', 'ENT_003', 'ENT_004', 'ENT_005', 'ENT_006', 'ENT_007'])}
            </div>
          </div>

          {/* Bottom row: Fluids, Chassis, Brakes, Charging (4 columns) */}
          <div className="grid grid-cols-4 gap-2 my-1">
            {renderCategoryBox('การตรวจสอบระดับของเหลว', ['FLD_001', 'FLD_002', 'FLD_003'])}
            {renderCategoryBox('ระบบแชสซี', ['CHS_001', 'CHS_002', 'CHS_003'])}
            {renderCategoryBox('ระบบเบรกและพวงมาลัย', ['BRK_001', 'BRK_002', 'BRK_003'])}
            {renderCategoryBox('การปลดล็อกของช่องชาร์จไฟ', ['CHG_001', 'CHG_002', 'CHG_003'])}
          </div>

          {/* Footer blocks: Battery check, Warning Light, Software diagnostics (3 columns) */}
          <div className="grid grid-cols-3 gap-2 mt-1 border-t border-slate-300 pt-1.5">
            {/* Box 1: Battery 12V Check */}
            <div className="border border-slate-400 rounded p-1.5 bg-white space-y-1 flex flex-col justify-between">
              <div className="font-bold text-[8.5px] border-b pb-0.5 text-center text-slate-800">
                การตรวจสอบแบตเตอรี่ (12V, 45Ah) ขณะดับรถ
              </div>
              <table className="w-full text-[8px] leading-tight">
                <tbody>
                  <tr>
                    <td className="text-slate-600 font-medium">1) ค่าความต่างศักย์:</td>
                    <td className="text-right font-bold font-mono text-slate-800">{batteryVoltage} <span className="font-normal text-slate-500">(≥12.6V)</span></td>
                  </tr>
                  <tr>
                    <td className="text-slate-600 font-medium">2) สุขภาพแบตเตอรี่ (SOH):</td>
                    <td className="text-right font-bold font-mono text-slate-800">{batterySoh} <span className="font-normal text-slate-500">(≥80%)</span></td>
                  </tr>
                  <tr>
                    <td className="text-slate-600 font-medium">3) สถานะการชาร์จ (SOC):</td>
                    <td className="text-right font-bold font-mono text-slate-800">{batterySoc} <span className="font-normal text-slate-500">(100%)</span></td>
                  </tr>
                  <tr>
                    <td className="text-slate-600 font-medium">4) ค่า CCA:</td>
                    <td className="text-right font-bold font-mono text-slate-800">{batteryCca} <span className="font-normal text-slate-500">(≥400A)</span></td>
                  </tr>
                  <tr className="border-t border-slate-100 mt-0.5">
                    <td className="text-slate-600 font-medium pt-0.5">แรงดันลมยางทั้งสี่ล้อ:</td>
                    <td className="text-right font-bold font-mono text-slate-800 pt-0.5">{tirePressure} <span className="font-normal text-slate-500">(35-39psi.)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Box 2: Speedometer Warning check */}
            <div className="border border-slate-400 rounded p-1.5 bg-white flex flex-col justify-between items-center text-center">
              <div className="font-bold text-[8.5px] border-b pb-0.5 w-full text-slate-800">
                การตรวจสอบ ไฟแสดงการทำงานผิดปกติของรถ
              </div>
              <div className="text-[7.5px] text-slate-500 font-medium leading-tight py-0.5">
                จะต้องไม่พบ ไฟแสดงการทำงานผิดปกติของรถบนหน้าจออย่างเด็ดขาด
              </div>
              <div className="h-14 w-full flex justify-center items-center overflow-hidden my-0.5">
                <img 
                  src="/images/dashboard_speedometer.png" 
                  alt="Speedometer instrument panel" 
                  className="h-full w-full object-cover rounded border border-slate-200"
                />
              </div>
            </div>

            {/* Box 3: Software diagnostics */}
            <div className="border border-slate-400 rounded p-1.5 bg-white flex flex-col justify-between items-center text-center">
              <div className="font-bold text-[8.5px] border-b pb-0.5 w-full text-slate-800">
                การวิเคราะห์และอัปเดตซอฟต์แวร์หน้ารถ
              </div>
              <div className="grid grid-cols-2 gap-1 w-full flex-grow items-center my-0.5">
                <div className="flex flex-col items-center">
                  <span className="text-[7px] text-slate-500 font-medium">การลบรหัสปัญหาโดยใช้ VDCI</span>
                  <img 
                    src="/images/vdci_software.png" 
                    alt="VDCI diagnostics" 
                    className="h-7 w-[90%] object-cover border border-slate-200 rounded mt-0.5"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[7px] text-slate-500 font-medium">ตรวจสอบและอัปเดตซอฟต์แวร์</span>
                  <img 
                    src="/images/ota_update.png" 
                    alt="OTA System update" 
                    className="h-7 w-[90%] object-cover border border-slate-200 rounded mt-0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nonconforming item and treatment result table (with 3 rows) */}
          <div className="mt-1.5">
            <div className="bg-[#00A2C9] text-white text-center py-0.5 font-bold text-[8.5px] rounded-t border border-[#00A2C9]">
              Nonconforming item and treatment result รายการที่ไม่ผ่านการตรวจสอบและผลการดำเนินการ
            </div>
            <table className="w-full text-[8px] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-400 p-0.5 text-center w-[5%]">No.</th>
                  <th className="border border-slate-400 p-0.5 text-left w-[30%]">รายการที่ตรวจสอบ</th>
                  <th className="border border-slate-400 p-0.5 text-left w-[30%]">ปัญหาที่พบ</th>
                  <th className="border border-slate-400 p-0.5 text-left w-[35%]">สาเหตุและการแก้ไข</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, idx) => {
                  const defect = job.defects?.[idx];
                  return (
                    <tr key={idx} className="h-4">
                      <td className="border border-slate-400 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 px-1 font-mono">{defect?.checklistItemCode || ''}</td>
                      <td className="border border-slate-400 px-1">{defect?.description || ''}</td>
                      <td className="border border-slate-400 px-1">
                        {defect ? (defect.status === 'RESOLVED' || defect.status === 'CLOSED' ? 'แก้ไขเรียบร้อยแล้ว' : 'ส่งปรับสภาพซ่อมแซม') : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Warning disclaimer text */}
          <div className="text-[7.5px] text-slate-500 leading-normal mt-1 text-justify font-medium">
            คำเตือน: เนื่องจากรถยนต์เกี่ยวข้องกับไฟฟ้าแรงสูง จึงต้องมีมาตรการป้องกันฉนวนก่อนดำเนินการตรวจสอบรถยนต์ อย่าเสียบหรือถอดชุดสายไฟแรงสูงใดๆ ในระหว่างการตรวจสอบ หากจำเป็นต้องบำรุงรักษา โปรดดูคู่มือการบำรุงรักษา
          </div>

          {/* Signatures block at absolute bottom of page */}
          <div className="grid grid-cols-2 gap-8 items-end mt-1.5 mb-1 text-[8.5px] border-t border-slate-300 pt-2 font-medium">
            <div className="flex justify-between items-end relative h-8">
              <span>ผู้ตรวจสอบ PDI:</span>
              <div className="absolute left-[70px] bottom-1 h-6 w-24 overflow-hidden flex items-center justify-center">
                {signatures?.inspector || job.inspectorSig ? (
                  <img src={signatures?.inspector || job.inspectorSig} className="h-6 object-contain" alt="inspector signature" />
                ) : null}
              </div>
              <span className="flex-grow border-b border-dotted border-slate-500 mx-2 text-center text-[8px] font-semibold pb-0.5 select-all">
                {(signatures?.inspector || job.inspectorSig) ? '' : (job.inspector?.name || '_________________________')}
              </span>
              <span>วันที่: __________________</span>
            </div>
            <div className="flex justify-between items-end relative h-8">
              <span>ที่ปรึกษาการขาย:</span>
              <div className="absolute left-[70px] bottom-1 h-6 w-24 overflow-hidden flex items-center justify-center">
                {signatures?.customer || job.customerSig ? (
                  <img src={signatures?.customer || job.customerSig} className="h-6 object-contain" alt="customer signature" />
                ) : null}
              </div>
              <span className="flex-grow border-b border-dotted border-slate-500 mx-2 text-center text-[8px] font-semibold pb-0.5 select-all">
                {(signatures?.customer || job.customerSig) ? '' : (job.customerName || '_________________________')}
              </span>
              <span>วันที่: __________________</span>
            </div>
          </div>

          {/* Bottom disclaimer banner with double warning border */}
          <div className="border-2 border-slate-900 rounded p-1.5 bg-slate-50/50 flex items-start gap-2 mt-1">
            <span className="text-amber-500 text-sm font-bold flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-[7px] leading-relaxed text-slate-600 font-medium">
              <span className="font-bold text-slate-800">หมายเหตุ:</span> เมื่อตัวแทนจำหน่ายได้รับส่งมอบรถยนต์ใหม่จากบริษัทเอสไอซีไทยแลนด์ฯ จะต้องทำการตรวจเช็คสภาพรถ หากพบเจอความบกพร่องใดๆ จะต้องแจ้งกลับบริษัทเอสไอซีไทยแลนด์ฯ ทันทีเพื่อรับทราบภายใน 24 ชั่วโมงนับจากเซ็นรับรถ หากแจ้งกลับหลังจาก 24 ชม. บริษัทมีสิทธิ์ในการปฏิเสธการให้เคลม ตัวแทนจำหน่ายสามารถเพิ่มเติมรายการตรวจสอบได้ตามที่เห็นสมควร
            </p>
          </div>

        </div>
      </div>
    );
}
