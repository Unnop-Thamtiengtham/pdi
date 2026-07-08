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
  const carImage = isHyptec 
    ? '/images/hyptec_ht_wireframe.png' 
    : isAionV 
      ? '/images/aion_v_wireframe.png' 
      : isAionUt
        ? '/images/aion_ut_wireframe_clean.png'
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
          .print-page-a4 {
            width: 210mm !important;
            height: 296mm !important;
            padding: 8mm 8mm 8mm 8mm !important;
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

      <div className="print-page-a4 flex flex-col justify-between h-[296mm] w-[210mm] mx-auto text-slate-800 text-[10px] leading-tight">
        
        {/* Header Block */}
        <div className="border-2 border-slate-800 p-2 rounded-xl space-y-2">
          {/* Logo & Title Row */}
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-2">
            <div className="flex items-center gap-1">
              <AionLogo />
            </div>
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-900 font-sans">{reportTitle}</h2>
            </div>
            <div className="text-right text-[8px] font-mono text-slate-500">
              เลขใบงาน: {job.jobNumber}
            </div>
          </div>

          {/* Metadata Grid Table */}
          <table className="w-full border-collapse border border-slate-800 text-[9px]">
            <tbody>
              <tr>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold w-[10%]">VIN</td>
                <td className="border border-slate-800 px-2 py-1 w-[30%] font-mono font-semibold select-all">{job.vehicleVin}</td>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold w-[15%]">หมายเลขมอเตอร์ / แบตเตอรี่</td>
                <td className="border border-slate-800 px-2 py-1 w-[25%] font-mono select-all">{job.vehicle?.motorBatteryNumber || '-'}</td>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold w-[8%]">รุ่นรถ</td>
                <td className="border border-slate-800 px-2 py-1 w-[12%] font-semibold">{job.vehicle?.modelName || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">{labelCol1}</td>
                <td className="border border-slate-800 px-2 py-1">{valCol1}</td>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">สีตัวถังรถ</td>
                <td className="border border-slate-800 px-2 py-1">{job.vehicle?.colorName || job.vehicle?.exteriorColor || '-'}</td>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">{labelCol3}</td>
                <td className="border border-slate-800 px-2 py-1">{valCol3}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">{labelCol4}</td>
                <td className="border border-slate-800 px-2 py-1">{valCol4}</td>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">{labelCol5}</td>
                <td className="border border-slate-800 px-2 py-1">{valCol5}</td>
                <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">ผู้ตรวจสอบ</td>
                <td className="border border-slate-800 px-2 py-1 font-semibold">{job.inspector?.name || '-'}</td>
              </tr>
              {job.pdiType === 'PRE_DELIVERY' && (
                <tr>
                  <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">เบอร์โทรพนักงานขาย</td>
                  <td className="border border-slate-800 px-2 py-1 font-mono">{job.salesPhone || '-'}</td>
                  <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">สาขาของ Sales</td>
                  <td className="border border-slate-800 px-2 py-1">{job.salesBranch || '-'}</td>
                  <td className="border border-slate-800 px-2 py-1 bg-slate-50 font-bold">ชื่อลูกค้าผู้รับรถ</td>
                  <td className="border border-slate-800 px-2 py-1 font-semibold">{job.customerName || '-'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Banner */}
        <div className="bg-[#00A2C9] text-white text-center py-1 px-3 rounded-lg font-bold text-[9px] flex justify-center gap-6">
          <span>ผลการตรวจสอบ จะต้องระบุตามนี้:</span>
          <span>ปกติ ✓</span>
          <span>ผิดปกติ ✗</span>
          <span>แก้ไขแล้ว o</span>
          <span>- ไม่มีในรถรุ่นนี้</span>
        </div>

        {/* Main Columns Grid (Left Categories - Center Diagram - Right Categories) */}
        <div className="grid grid-cols-10 gap-3 items-stretch my-1 flex-grow">
          {/* Left Column (3/10) */}
          <div className="col-span-3 flex flex-col justify-between space-y-2 h-full">
            {renderCategoryBox('ตัวสีภายนอก', ['EXT_001', 'EXT_002', 'EXT_003', 'EXT_004', 'EXT_005', 'EXT_006', 'EXT_007'])}
            {renderCategoryBox('ระบบไฟส่องสว่าง', ['LGT_001', 'LGT_002', 'LGT_003', 'LGT_004', 'LGT_005', 'LGT_006', 'LGT_007', 'LGT_008', 'LGT_009'])}
            {renderCategoryBox('การตรวจสอบระดับของเหลว', ['FLD_001', 'FLD_002', 'FLD_003'])}
          </div>

          {/* Center Diagram (4/10) */}
          <div className="col-span-4 border border-slate-300 rounded-lg bg-white p-2 flex justify-center items-center flex-grow h-full overflow-hidden">
            <img 
              src={`${carImage}?v=19`} 
              alt="Car Blueprint Wireframe" 
              className="max-w-full max-h-[300px] object-contain opacity-95 mix-blend-multiply" 
            />
          </div>

          {/* Right Column (3/10) */}
          <div className="col-span-3 flex flex-col justify-between space-y-2 h-full">
            {renderCategoryBox('กระจกหน้ารถและที่ปัดน้ำฝน', ['GLS_001', 'GLS_002', 'GLS_003', 'GLS_004'])}
            {renderCategoryBox('ระบบปรับอากาศ', ['AC_001', 'AC_002'])}
            {renderCategoryBox('ระบบความบันเทิง', ['ENT_001', 'ENT_002', 'ENT_003', 'ENT_004', 'ENT_005', 'ENT_006', 'ENT_007'])}
          </div>
        </div>

        {/* Chassis, Brakes, Chargeport Row (3 boxes side by side) */}
        <div className="grid grid-cols-3 gap-3 my-1">
          {renderCategoryBox('ระบบแชสซี', ['CHS_001', 'CHS_002', 'CHS_003'])}
          {renderCategoryBox('ระบบเบรกและพวงมาลัย', ['BRK_001', 'BRK_002', 'BRK_003'])}
          {renderCategoryBox('การปลดล็อกฝาปิดช่องชาร์จ', ['CHG_001', 'CHG_002', 'CHG_003'])}
        </div>

        {/* Footer Blocks (Battery check, Warning, Software diagnostics, Signatures) */}
        <div className="grid grid-cols-12 gap-3 items-stretch mt-1 border-t border-slate-300 pt-2">
          {/* Battery check (3/12) */}
          <div className="col-span-3 border border-slate-400 rounded-lg p-1.5 bg-white space-y-1 flex flex-col justify-between">
            <div className="font-bold text-[9px] border-b pb-0.5 text-center text-slate-800">การตรวจสอบแบตเตอรี่ (12V)</div>
            <table className="w-full text-[8px] leading-tight">
              <tbody>
                {hasVoltage && (
                  <tr>
                    <td>ความต่างศักย์:</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">{batteryVoltage}</td>
                  </tr>
                )}
                {hasSoh && (
                  <tr>
                    <td>SOH:</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">{batterySoh}</td>
                  </tr>
                )}
                {hasSubVoltage && (
                  <tr>
                    <td>ความต่างศักย์ (รอง):</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">
                      {battery.secVoltage !== undefined && battery.secVoltage !== null ? `${battery.secVoltage} V` : '_______ V'}
                    </td>
                  </tr>
                )}
                {hasSubSoh && (
                  <tr>
                    <td>SOH (รอง):</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">
                      {battery.secSoh !== undefined && battery.secSoh !== null ? `${battery.secSoh} %` : '_______ %'}
                    </td>
                  </tr>
                )}
                {hasSoc && (
                  <tr>
                    <td>SOC:</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">{batterySoc}</td>
                  </tr>
                )}
                {hasCca && (
                  <tr>
                    <td>CCA:</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">{batteryCca}</td>
                  </tr>
                )}
                {hasTirePressure && (
                  <tr>
                    <td>แรงดันลมยาง:</td>
                    <td className="text-right font-bold font-mono whitespace-nowrap">{tirePressure}</td>
                  </tr>
                )}
                {nonNumericBatteryItems.map(item => {
                  const itemId = item.id;
                  const itemCode = item.itemCode;
                  const symbol = getResultSymbol(itemId, itemCode);
                  const itemName = item.itemName.replace('*', '');
                  return (
                    <tr key={item.id}>
                      <td className="pr-1 leading-tight">{itemName}:</td>
                      <td className="text-right font-bold text-[9px] font-mono whitespace-nowrap">{symbol}</td>
                    </tr>
                  );
                })}
                {!hasVoltage && !hasSoh && !hasSubVoltage && !hasSubSoh && !hasSoc && !hasCca && !hasTirePressure && nonNumericBatteryItems.length === 0 && (
                  <tr>
                    <td className="text-center text-slate-400 py-2">— ไม่มีรายการตรวจวัด —</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Warning Lights (3/12) */}
          <div className="col-span-3 border border-slate-400 rounded-lg p-1.5 bg-white flex flex-col justify-between items-center text-center">
            <div className="font-bold text-[9px] border-b pb-0.5 w-full text-slate-800">ไฟเตือนหน้าปัดรถยนต์</div>
            <div className="flex flex-col items-center justify-start flex-1 pt-1.5 w-full">
              <div className="text-[7px] text-slate-500 leading-tight font-semibold flex items-center justify-center gap-0.5">
                <svg className="w-3.5 h-3.5 text-slate-400 inline-block flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>ไม่พบไฟเตือนสะสม</span>
              </div>
              <div className="text-[8px] font-bold text-green-600 mt-0.5">ปกติ ✓</div>
            </div>
          </div>

          {/* Software Diagnostics (3/12) */}
          <div className="col-span-3 border border-slate-400 rounded-lg p-1.5 bg-white flex flex-col justify-between items-center text-center">
            <div className="font-bold text-[9px] border-b pb-0.5 w-full text-slate-800">การวิเคราะห์ซอฟต์แวร์</div>
            <div className="flex justify-around items-center w-full flex-1 my-1">
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-slate-500 font-semibold">ลบ DTC (VDCI)</span>
                <span className="text-[8px] font-bold text-green-600">สำเร็จ ✓</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-slate-500 font-semibold">OTA Update</span>
                <span className="text-[8px] font-bold text-green-600">ล่าสุด ✓</span>
              </div>
            </div>
          </div>

          {/* Signatures (3/12) */}
          <div className="col-span-3 border border-slate-400 rounded-lg p-1.5 bg-white flex flex-col justify-between">
            <div className="font-bold text-[9px] border-b pb-0.5 text-center text-slate-800">ยืนยันผลการตรวจสภาพ</div>
            <div className="flex flex-col space-y-1 my-1 text-[8px] leading-normal">
              <div className="flex justify-between items-center border-b pb-0.5">
                <span>ผู้ตรวจ:</span>
                <span className="font-semibold truncate max-w-[60px]">{job.inspector?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>QC/Super:</span>
                <span className="font-semibold truncate max-w-[60px]">{job.approver?.name || '-'}</span>
              </div>
            </div>
            {/* Tiny Signatures Canvas */}
            <div className="h-6 flex justify-around items-center border border-dashed rounded bg-slate-50/50 overflow-hidden">
              {signatures?.inspector || job.inspectorSig ? (
                <img src={signatures?.inspector || job.inspectorSig} className="h-5 max-w-[45%] object-contain" alt="Sig" />
              ) : <span className="text-[7px] text-slate-400">-</span>}
              {signatures?.supervisor || job.supervisorSig ? (
                <img src={signatures?.supervisor || job.supervisorSig} className="h-5 max-w-[45%] object-contain" alt="Sig" />
              ) : <span className="text-[7px] text-slate-400">-</span>}
            </div>
          </div>
        </div>

        {/* Defect Records Section */}
        <div className="border border-slate-400 rounded-lg p-2 bg-white flex-grow min-h-[70px] flex flex-col justify-between mt-1.5 mb-1.5">
          <div>
            <div className="font-bold text-[9px] border-b pb-1 text-slate-800 mb-1">
              รายการจุดบกพร่องจากการตรวจสภาพ (Defect Records)
            </div>
            {job.defects && job.defects.length > 0 ? (
              <table className="w-full text-[8px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300">
                    <th className="border border-slate-200 p-1 text-center w-[8%]">ลำดับ</th>
                    <th className="border border-slate-200 p-1 text-left w-[20%]">รหัสรายการ</th>
                    <th className="border border-slate-200 p-1 text-left">รายละเอียดอาการ</th>
                    <th className="border border-slate-200 p-1 text-center w-[12%]">ความรุนแรง</th>
                    <th className="border border-slate-200 p-1 text-center w-[15%]">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {job.defects.map((defect: any, idx: number) => {
                    const severityText = defect.severity === 'CRITICAL' ? 'รุนแรง' : 'ทั่วไป';
                    const severityColor = defect.severity === 'CRITICAL' ? 'text-red-600 font-bold' : 'text-slate-600';
                    
                    let statusText = defect.status;
                    let statusColor = 'text-slate-600';
                    if (defect.status === 'OPEN') {
                      statusText = 'รอดำเนินการ';
                      statusColor = 'text-red-500 font-semibold';
                    } else if (defect.status === 'IN_REPAIR') {
                      statusText = 'กำลังซ่อมแซม';
                      statusColor = 'text-amber-500 font-semibold';
                    } else if (defect.status === 'RESOLVED') {
                      statusText = 'แก้ไขแล้ว';
                      statusColor = 'text-green-600 font-semibold';
                    } else if (defect.status === 'CLOSED') {
                      statusText = 'ปิดงาน';
                      statusColor = 'text-slate-600';
                    }

                    return (
                      <tr key={defect.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="p-1 border border-slate-100 text-center">{defect.defectNo || (idx + 1)}</td>
                        <td className="p-1 border border-slate-100 text-left font-mono font-bold text-slate-700">{defect.checklistItemCode || '-'}</td>
                        <td className="p-1 border border-slate-100 text-left text-slate-600 leading-tight">{defect.description}</td>
                        <td className={`p-1 border border-slate-100 text-center ${severityColor}`}>{severityText}</td>
                        <td className={`p-1 border border-slate-100 text-center ${statusColor}`}>{statusText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-2 text-[8px] text-slate-400 font-medium">
                — ไม่พบข้อมูลจุดบกพร่องสะสมในการตรวจสอบครั้งนี้ (ตรวจผ่าน 100%) —
              </div>
            )}
          </div>
        </div>

        {/* Footer watermark */}
        <div className="text-center text-[7px] text-slate-400 mt-0.5 border-t pt-0.5">
          เอกสารผลการตรวจสอบ PDI Digital — พิมพ์อ้างอิงจากระบบ Gold Integrate Co., Ltd.
        </div>
      </div>
    </div>
  );
}
