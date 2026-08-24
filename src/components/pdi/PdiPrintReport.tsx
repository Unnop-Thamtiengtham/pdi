'use client';

import React from 'react';
import { MODEL_RULES, ModelCode } from '@/types/pdi';
import { PdiPrintHeader } from './print/PdiPrintHeader';
import { PdiPrintChecklist } from './print/PdiPrintChecklist';
import { PdiPrintBatterySection } from './print/PdiPrintBatterySection';
import { PdiPrintSignatures } from './print/PdiPrintSignatures';

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

  let labelCol1 = "ชื่อผู้จำหน่าย";
  let valCol1 = job.salesName || '-';
  let labelCol3 = "วันที่รับรถ";
  let valCol3 = job.targetDeliveryDate ? new Date(job.targetDeliveryDate).toLocaleDateString('th-TH') : '-';

  let labelCol4 = "วันที่รับเข้าสต็อก";
  let valCol4 = job.vehicle?.arrivedAt ? new Date(job.vehicle.arrivedAt).toLocaleDateString('th-TH') : '-';
  let labelCol5 = job.completedAt ? new Date(job.completedAt).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH');

  if (job.pdiType === 'INCOMING') {
    labelCol1 = "ผู้บันทึก";
    valCol1 = job.inspector?.name || '-';
    labelCol3 = "วันที่รถมาถึง";
    valCol3 = job.vehicle?.arrivedAt ? new Date(job.vehicle.arrivedAt).toLocaleDateString('th-TH') : '-';
    labelCol4 = job.vehicle?.incomingDeadline ? new Date(job.vehicle.incomingDeadline).toLocaleDateString('th-TH') : '-';
  } else if (job.pdiType === 'LONG_TERM') {
    labelCol1 = "รอบการตรวจ";
    valCol1 = job.ltmInterval ? `${job.ltmInterval} วัน` : '-';
    labelCol3 = "วันที่กำหนดตรวจ";
    valCol3 = job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('th-TH') : '-';
    labelCol4 = job.vehicle?.arrivedAt ? new Date(job.vehicle.arrivedAt).toLocaleDateString('th-TH') : '-';
  }

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
          
          {/* Header Block */}
          <PdiPrintHeader
            job={job}
            valCol1={valCol1}
            valCol3={valCol3}
            valCol4={valCol4}
            valCol5={labelCol5}
          />

          {/* Blue Legend Bar */}
          <div className="bg-[#00A2C9] text-white text-center py-0.5 px-3 rounded font-bold text-[8.5px] flex justify-center gap-6 mt-1">
            <span>ผลการตรวจสอบ จะต้องระบุตามนี้ :</span>
            <span>ปกติ ✓</span>
            <span>ผิดปกติ ✗</span>
            <span>แก้ไขแล้ว o</span>
            <span>- ไม่มีในรถรุ่นนี้</span>
          </div>

          {/* Checklist columns and Diagram */}
          <PdiPrintChecklist
            templateItems={templateItems}
            resultsMap={resultsMap}
            carImage={carImage}
          />

          {/* Battery section */}
          <PdiPrintBatterySection
            batteryVoltage={batteryVoltage}
            batterySoh={batterySoh}
            batterySoc={batterySoc}
            batteryCca={batteryCca}
            tirePressure={tirePressure}
          />

          {/* Signatures and Defects table */}
          <PdiPrintSignatures
            job={job}
            signatures={signatures}
          />

        </div>
      </div>
    );
}
