import React from 'react';

interface PdiPrintBatterySectionProps {
  batteryVoltage: string;
  batterySoh: string;
  batterySoc: string;
  batteryCca: string;
  tirePressure: string;
}

export function PdiPrintBatterySection({
  batteryVoltage,
  batterySoh,
  batterySoc,
  batteryCca,
  tirePressure,
}: PdiPrintBatterySectionProps) {
  return (
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
  );
}
