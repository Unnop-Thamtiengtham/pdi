import React from 'react';

interface PdiPrintHeaderProps {
  job: any;
  valCol1: string;
  valCol3: string;
  valCol4: string;
  valCol5: string;
}

export function PdiPrintHeader({ job, valCol1, valCol3, valCol4, valCol5 }: PdiPrintHeaderProps) {
  const AionLogo = () => (
    <svg className="h-6" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L1 18H5L7 14H13L15 18H19L10 2ZM10 8L12 12H8L10 8Z" fill="#00A2C9" />
      <rect x="23" y="2" width="4" height="16" fill="#00A2C9" />
      <path d="M37 2C32.5817 2 29 5.58172 29 10C29 14.4183 32.5817 18 37 18C41.4183 18 45 14.4183 45 10C45 5.58172 41.4183 2 37 2ZM37 14C34.7909 14 33 12.2091 33 10C33 7.79086 34.7909 6 37 6C39.2091 6 41 7.79086 41 10C41 12.2091 39.2091 14 37 14Z" fill="#00A2C9" />
      <path d="M49 18V2H53L59 13V2H63V18H59L53 7V18H49Z" fill="#00A2C9" />
    </svg>
  );

  return (
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
  );
}
