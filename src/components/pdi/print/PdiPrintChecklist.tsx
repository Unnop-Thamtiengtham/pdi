import React from 'react';

interface PdiPrintChecklistProps {
  templateItems: any[];
  resultsMap: Record<string, any>;
  carImage: string;
}

export function PdiPrintChecklist({ templateItems, resultsMap, carImage }: PdiPrintChecklistProps) {
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
      EXT_001: 'ประตู',
      EXT_002: 'ฝากระโปรงหน้า/หลัง',
      EXT_003: 'โป่งหลัง',
      EXT_004: 'กันชนหน้าและกันชนหลัง',
      EXT_005: 'สเกิร์ตข้าง',
      EXT_006: 'บังโคลนล้อแม็ก',
      EXT_007: 'รูปลักษณ์ภายใน',
      LGT_001: 'ระบบไฟ DRL / ไฟหรี่',
      LGT_002: 'ไฟหน้าต่ำ',
      LGT_003: 'ไฟหน้าสูง',
      LGT_004: 'ไฟฉุกเฉิน',
      LGT_005: 'ไฟตัดหมอกหน้า-หลัง',
      LGT_006: 'ไฟเบรก',
      LGT_007: 'ไฟถอย',
      LGT_008: 'ไฟเลี้ยว',
      LGT_009: 'ไฟภายในห้องโดยสาร',
      FLD_001: 'น้ำยาหล่อเย็น',
      FLD_002: 'น้ำมันเบรก',
      FLD_003: 'น้ำยาทำความสะอาดกระจก',
      GLS_001: 'กระจกทำงานปกติ/ระบบกันหนีบ',
      GLS_002: 'การทำงานของที่ปัดน้ำฝน',
      GLS_003: 'การทำงานของที่ฉีดกระจก',
      GLS_004: 'ซันรูฟ / ม่านบังแดด',
      AC_001: 'ทดสอบการทำความเย็นและความร้อน',
      AC_002: 'ทิศทางลมตามหน้าจอรถ',
      ENT_001: 'ฟังก์ชันการนำทาง',
      ENT_002: 'การทำงานของระบบเครื่องเสียง',
      ENT_003: 'การทำงานของระบบบลูทูธ (Bluetooth)',
      ENT_004: 'ฟังก์ชันอินเทอร์เน็ตและเครือข่าย',
      ENT_005: 'การทำงานระบบสั่งงานด้วยเสียง',
      ENT_006: 'การทำงานระบบชาร์จมือถือไร้สาย',
      ENT_007: 'การทำงานของระบบกล้องรอบคัน',
      CHS_001: 'ระดับไฟแบตเตอรี่มากกว่า 50%',
      CHS_002: 'จุดเชื่อมต่อของท่อต่างๆ',
      CHS_003: 'การขันยึดน็อต/สกรูในตำแหน่งสำคัญ เช่น ขั้วแบตเตอรี่ 12V',
      BRK_001: 'การทำงานของระบบเบรก',
      BRK_002: 'การทำงานของปั๊มเบรกสุญญากาศ/หม้อลมเบรก',
      BRK_003: 'การทำงานของพวงมาลัย ไม่กินซ้ายหรือกินขวา',
      CHG_001: 'ปุ่มปลดล็อกบนรีโมท',
      CHG_002: 'สวิตช์ชาร์จไฟ',
      CHG_003: 'สายเคเบิลปลดล็อกฉุกเฉิน',
    };
    return map[code] || code;
  };

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

  return (
    <>
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
    </>
  );
}
