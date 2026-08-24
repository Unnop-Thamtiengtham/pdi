import React from 'react';

interface PdiPrintSignaturesProps {
  job: any;
  signatures?: {
    customer: string | null;
    inspector: string | null;
    supervisor: string | null;
  };
}

export function PdiPrintSignatures({ job, signatures }: PdiPrintSignaturesProps) {
  return (
    <>
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
    </>
  );
}
