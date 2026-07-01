'use client';

import React from 'react';
import { CHECKLIST_CATEGORIES, BATTERY_THRESHOLDS, MODEL_RULES } from '@/types/pdi';
import { formatDateTime } from '@/lib/utils';

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

  // ── Helpers ──────────────────────────────────────────────
  const getMockSignatureUrl = (name: string) => {
    if (!name) return null;
    const cleanName = name.trim();
    // Return an SVG with a cursive-like styling
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50">
      <style>
        .sigText {
          font-family: 'Brush Script MT', 'Dancing Script', 'Segoe Print', 'Comic Sans MS', cursive;
          font-size: 22px;
          fill: #1e3a8a;
        }
      </style>
      <text x="20" y="32" class="sigText">${cleanName}</text>
      <path d="M 10 38 Q 40 42 140 38" stroke="#1e3a8a" stroke-width="1.5" fill="none" opacity="0.6"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอตรวจ (PENDING)';
      case 'IN_PROGRESS': return 'กำลังตรวจ (IN_PROGRESS)';
      case 'DEFECT_FOUND': return 'พบจุดบกพร่อง/กำลังซ่อม (DEFECT_FOUND)';
      case 'PENDING_APPROVAL': return 'รอยืนยันอนุมัติ (PENDING_APPROVAL)';
      case 'APPROVED': return 'ผ่านการอนุมัติ (APPROVED)';
      case 'REJECTED': return 'ไม่ผ่าน/ตีกลับ (REJECTED)';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-700';
      case 'PENDING_APPROVAL': return 'text-amber-600';
      case 'DEFECT_FOUND': return 'text-red-600';
      case 'PENDING': return 'text-slate-500';
      default: return 'text-slate-700';
    }
  };

  const getPdiTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOMING': return 'Incoming PDI (ตรวจรับเข้า)';
      case 'LONG_TERM': return 'Long-term Maintenance (บำรุงรักษาประจำ)';
      case 'PRE_DELIVERY': return 'Pre-delivery PDI (ก่อนส่งมอบ)';
      default: return type;
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'PASS': return '✓ ผ่าน';
      case 'FAIL': return '✗ ไม่ผ่าน';
      case 'REPAIRED': return '↻ ซ่อมแล้ว';
      case 'NA': return '— N/A';
      default: return '✓ ผ่าน';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'PASS': return 'text-green-700';
      case 'FAIL': return 'text-red-700';
      case 'REPAIRED': return 'text-amber-700';
      default: return 'text-slate-500';
    }
  };

  // ── Data processing ─────────────────────────────────────
  const resultsMap: Record<string, any> = {};
  (job.checklistItems || []).forEach((r: any) => {
    resultsMap[r.itemId] = r;
  });

  const groupedItems = CHECKLIST_CATEGORIES
    .filter(cat => templateItems.some(item => {
      const matched = CHECKLIST_CATEGORIES.find(c => c.name === item.category);
      return (matched ? matched.code : 'EXTERIOR') === cat.code;
    }))
    .map(cat => ({
      ...cat,
      items: templateItems.filter(item => {
        const matched = CHECKLIST_CATEGORIES.find(c => c.name === item.category);
        return (matched ? matched.code : 'EXTERIOR') === cat.code;
      }),
    }));

  // Summary stats
  const totalItems = templateItems.length;
  const passCount = templateItems.filter(item => (resultsMap[item.id]?.result || 'PASS') === 'PASS').length;
  const failCount = templateItems.filter(item => resultsMap[item.id]?.result === 'FAIL').length;
  const repairedCount = templateItems.filter(item => resultsMap[item.id]?.result === 'REPAIRED').length;
  const naCount = templateItems.filter(item => resultsMap[item.id]?.result === 'NA').length;

  const battery = job.batteryTestResult || {};
  const defects = job.defects || [];
  const t = BATTERY_THRESHOLDS;
  const modelCode = job.vehicle?.modelCode as keyof typeof MODEL_RULES;
  const rules = MODEL_RULES[modelCode] || MODEL_RULES.AION_V;

  // ── Reusable header ─────────────────────────────────────
  const CompanyHeader = ({ subtitle }: { subtitle?: string }) => (
    <div className="print-header">
      <div className="print-header-left">
        <svg className="print-logo" viewBox="0 0 24 24">
          <path d="M12 3.5a8.5 8.5 0 1 1-5 15.3M12 20.5a8.5 8.5 0 0 1-5-1.6" stroke="#5f6368" strokeWidth="2.5" fill="none" />
          <path d="M8.5 15L12 9l3.5 6" stroke="#30c0d0" strokeWidth="2.5" fill="none" />
        </svg>
        <div>
          <span className="print-brand-accent">GOLD</span>
          <div className="print-brand-name">INTEGRATE</div>
        </div>
      </div>
      <div className="print-header-right">
        <div className="print-report-title">ใบรายงานผลการตรวจสอบรถ (PDI Inspection Report)</div>
        <div className="print-report-subtitle">
          เลขที่ใบสั่งงาน: {job.jobNumber}
          {subtitle ? ` — ${subtitle}` : ''}
        </div>
      </div>
    </div>
  );

  // ── Validation badge ────────────────────────────────────
  const ValidationBadge = ({ pass }: { pass: boolean | null }) => {
    if (pass === null) return <span>-</span>;
    return pass
      ? <span className="text-green-700 font-semibold">✓ ผ่าน</span>
      : <span className="text-red-700 font-semibold">✗ ไม่ผ่าน</span>;
  };

  return (
    <div className="hidden print:block print-report">

      {/* ════════════════════════════════════════════════════
          PAGE 1: COVER & SUMMARY
         ════════════════════════════════════════════════════ */}
      <div className="print-page">
        <CompanyHeader />

        {/* Job & Vehicle Information */}
        <div className="print-grid-2">
          {/* Job Information */}
          <div>
            <h3 className="print-section-title">ข้อมูลใบสั่งงาน (Job Information)</h3>
            <table className="print-info-table">
              <tbody>
                <tr>
                  <td className="print-td-label">เลขที่ใบสั่งงาน</td>
                  <td className="print-td-value print-mono">{job.jobNumber}</td>
                </tr>
                <tr>
                  <td className="print-td-label">ประเภท PDI</td>
                  <td className="print-td-value">{getPdiTypeLabel(job.pdiType)}</td>
                </tr>
                <tr>
                  <td className="print-td-label">สถานะ</td>
                  <td className={`print-td-value font-semibold ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </td>
                </tr>
                {job.status === 'APPROVED' && (
                  <tr>
                    <td className="print-td-label">วันที่อนุมัติ</td>
                    <td className="print-td-value">{formatDateTime(job.approvedAt)}</td>
                  </tr>
                )}
                {job.pdiType === 'LONG_TERM' && (
                  <>
                    <tr>
                      <td className="print-td-label">รอบการตรวจบำรุงรักษา</td>
                      <td className="print-td-value">{job.ltmInterval ? `${job.ltmInterval} วัน` : '-'}</td>
                    </tr>
                    <tr>
                      <td className="print-td-label">วันที่กำหนดตรวจ</td>
                      <td className="print-td-value">{formatDateTime(job.scheduledDate)}</td>
                    </tr>
                  </>
                )}
                {job.pdiType === 'PRE_DELIVERY' && (
                  <>
                    <tr>
                      <td className="print-td-label">กำหนดวันส่งมอบ</td>
                      <td className="print-td-value">{formatDateTime(job.targetDeliveryDate)}</td>
                    </tr>
                    <tr>
                      <td className="print-td-label">พนักงานขาย (Sales)</td>
                      <td className="print-td-value">{job.salesName || '-'}</td>
                    </tr>
                    <tr>
                      <td className="print-td-label">ชื่อลูกค้าผู้รับรถ</td>
                      <td className="print-td-value">{job.customerName || '-'}</td>
                    </tr>
                    <tr>
                      <td className="print-td-label">เบอร์ติดต่อลูกค้า</td>
                      <td className="print-td-value">{job.customerPhone || '-'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Vehicle Information */}
          <div>
            <h3 className="print-section-title">ข้อมูลรถยนต์ (Vehicle Information)</h3>
            <table className="print-info-table">
              <tbody>
                <tr>
                  <td className="print-td-label">เลขตัวถัง (VIN)</td>
                  <td className="print-td-value print-mono">{job.vehicleVin}</td>
                </tr>
                <tr>
                  <td className="print-td-label">รุ่น (Model)</td>
                  <td className="print-td-value">{job.vehicle?.modelName}</td>
                </tr>
                <tr>
                  <td className="print-td-label">สีภายนอก</td>
                  <td className="print-td-value">{job.vehicle?.colorName || job.vehicle?.exteriorColor || '-'}</td>
                </tr>
                <tr>
                  <td className="print-td-label">สีภายใน</td>
                  <td className="print-td-value">{job.vehicle?.interiorColor || '-'}</td>
                </tr>
                <tr>
                  <td className="print-td-label">ปีผลิต</td>
                  <td className="print-td-value">{job.vehicle?.productionYear || '-'}</td>
                </tr>
                <tr>
                  <td className="print-td-label">สาขา</td>
                  <td className="print-td-value">{job.vehicle?.branch?.name || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="print-section">
          <h3 className="print-section-title">สรุปผลการตรวจ (Inspection Summary)</h3>
          <div className="print-stats-grid">
            <div className="print-stat-box">
              <div className="print-stat-number">{totalItems}</div>
              <div className="print-stat-label">รายการทั้งหมด</div>
            </div>
            <div className="print-stat-box print-stat-pass">
              <div className="print-stat-number text-green-700">{passCount}</div>
              <div className="print-stat-label text-green-600">ผ่าน (PASS)</div>
            </div>
            <div className="print-stat-box print-stat-fail">
              <div className="print-stat-number text-red-700">{failCount}</div>
              <div className="print-stat-label text-red-600">ไม่ผ่าน (FAIL)</div>
            </div>
            <div className="print-stat-box print-stat-repaired">
              <div className="print-stat-number text-amber-700">{repairedCount}</div>
              <div className="print-stat-label text-amber-600">ซ่อมแล้ว (REPAIRED)</div>
            </div>
            <div className="print-stat-box print-stat-na">
              <div className="print-stat-number text-slate-600">{naCount}</div>
              <div className="print-stat-label text-slate-500">ไม่ใช้ (N/A)</div>
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="print-grid-2">
          <div>
            <h3 className="print-section-title">ผู้ปฏิบัติงาน (Personnel)</h3>
            <table className="print-info-table">
              <tbody>
                <tr>
                  <td className="print-td-label">ผู้ตรวจ (Inspector)</td>
                  <td className="print-td-value">{job.inspector?.name || '-'}</td>
                </tr>
                <tr>
                  <td className="print-td-label">ผู้อนุมัติ (QC/Supervisor)</td>
                  <td className="print-td-value">{job.approver?.name || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {defects.length > 0 && (
            <div>
              <h3 className="print-section-title">สรุปจุดบกพร่อง (Defect Summary)</h3>
              <table className="print-info-table">
                <tbody>
                  <tr>
                    <td className="print-td-label">จุดบกพร่องทั้งหมด</td>
                    <td className="print-td-value">{defects.length} รายการ</td>
                  </tr>
                  <tr>
                    <td className="print-td-label">แก้ไขแล้ว (Resolved)</td>
                    <td className="print-td-value text-green-700">{defects.filter((d: any) => d.status === 'RESOLVED').length} รายการ</td>
                  </tr>
                  <tr>
                    <td className="print-td-label">ค้างดำเนินการ</td>
                    <td className="print-td-value text-red-700">{defects.filter((d: any) => d.status !== 'RESOLVED').length} รายการ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          PAGE 2: FULL CHECKLIST RESULTS
         ════════════════════════════════════════════════════ */}
      <div className="print-page print-page-break">
        <CompanyHeader subtitle="ผลการตรวจรายการ (Checklist Results)" />

        {groupedItems.map((category, catIdx) => (
          <div key={category.code} className="print-category-block">
            <div className="print-category-header">
              {catIdx + 1}. {category.name}
            </div>
            <table className="print-checklist-table">
              <thead>
                <tr>
                  <th className="w-[28px] text-center">#</th>
                  <th className="w-[72px] text-left">รหัส</th>
                  <th className="text-left">รายการตรวจ</th>
                  <th className="w-[88px] text-center">ผลตรวจ</th>
                  <th className="w-[64px] text-center">ค่าวัด</th>
                  <th className="w-[100px] text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item: any, idx: number) => {
                  const result = resultsMap[item.id];
                  const resultValue = result?.result || 'PASS';
                  return (
                    <tr key={item.id} className={resultValue === 'FAIL' ? 'print-row-fail' : ''}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="print-mono text-[9px]">{item.itemCode}</td>
                      <td>{item.itemName}</td>
                      <td className={`text-center font-semibold ${getResultColor(resultValue)}`}>
                        {getResultLabel(resultValue)}
                      </td>
                      <td className="text-center print-mono">
                        {result?.numericValue != null
                          ? `${result.numericValue}${item.numericUnit ? ` ${item.numericUnit}` : ''}`
                          : '-'}
                      </td>
                      <td className="text-[9px]">{result?.remark || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          PAGE 3: BATTERY, DEFECTS & SIGNATURES
         ════════════════════════════════════════════════════ */}
      <div className="print-page print-page-break">
        <CompanyHeader subtitle="ผลตรวจแบตเตอรี่ & ลายเซ็น (Battery & Signatures)" />

        {/* Battery Test Results */}
        <div className="print-section">
          <h3 className="print-section-title">ผลตรวจสอบระบบไฟฟ้าและแบตเตอรี่ (Battery & Electrical Test Results)</h3>
          <div className="print-grid-2">
            {/* Main 12V Battery */}
            <table className="print-info-table">
              <thead>
                <tr>
                  <th colSpan={3} className="print-battery-header">แบตเตอรี่ 12V (ลูกหลัก)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="print-td-label">แรงดันไฟฟ้า (Voltage)</td>
                  <td className="print-td-value print-mono">{battery.mainVoltage != null ? `${battery.mainVoltage} V` : '-'}</td>
                  <td className="print-td-badge">
                    <ValidationBadge pass={battery.mainVoltage != null ? battery.mainVoltage >= t.voltageMin : null} />
                  </td>
                </tr>
                <tr>
                  <td className="print-td-label">ค่าสุขภาพ SOH</td>
                  <td className="print-td-value print-mono">{battery.mainSoh != null ? `${battery.mainSoh}%` : '-'}</td>
                  <td className="print-td-badge">
                    <ValidationBadge pass={battery.mainSoh != null ? battery.mainSoh >= t.sohMin : null} />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Secondary 12V or HV Battery */}
            <table className="print-info-table">
              <thead>
                <tr>
                  <th colSpan={3} className="print-battery-header">
                    {rules.hasDualBattery ? 'แบตเตอรี่ 12V (ลูกรอง)' : 'แบตเตอรี่ขับเคลื่อน (HV) & ลมยาง'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.hasDualBattery ? (
                  <>
                    <tr>
                      <td className="print-td-label">แรงดันไฟฟ้า (Voltage)</td>
                      <td className="print-td-value print-mono">{battery.secVoltage != null ? `${battery.secVoltage} V` : '-'}</td>
                      <td className="print-td-badge">
                        <ValidationBadge pass={battery.secVoltage != null ? battery.secVoltage >= t.voltageMin : null} />
                      </td>
                    </tr>
                    <tr>
                      <td className="print-td-label">ค่าสุขภาพ SOH</td>
                      <td className="print-td-value print-mono">{battery.secSoh != null ? `${battery.secSoh}%` : '-'}</td>
                      <td className="print-td-badge">
                        <ValidationBadge pass={battery.secSoh != null ? battery.secSoh >= t.sohMin : null} />
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="print-td-label">ระดับแบตเตอรี่ HV</td>
                      <td className="print-td-value print-mono">{battery.hvBatteryLevel != null ? `${battery.hvBatteryLevel}%` : '-'}</td>
                      <td className="print-td-badge">
                        <ValidationBadge pass={battery.hvBatteryLevel != null ? battery.hvBatteryLevel >= rules.hvBatteryMin : null} />
                      </td>
                    </tr>
                    {rules.hasTirePressure && (
                      <tr>
                        <td className="print-td-label">แรงดันลมยาง</td>
                        <td className="print-td-value print-mono">{battery.tirePressure != null ? `${battery.tirePressure} psi` : '-'}</td>
                        <td className="print-td-badge">
                          <ValidationBadge pass={battery.tirePressure != null ? (battery.tirePressure >= t.tirePressureMin && battery.tirePressure <= t.tirePressureMax) : null} />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* CCA / SOC for AION Y Plus */}
          {rules.hasCCA && (
            <table className="print-info-table" style={{ marginTop: '8px' }}>
              <thead>
                <tr>
                  <th colSpan={3} className="print-battery-header">กระแสสตาร์ทเย็น & พลังงาน (CCA / SOC)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="print-td-label">ค่า CCA</td>
                  <td className="print-td-value print-mono">{battery.mainCca != null ? `${battery.mainCca} A` : '-'}</td>
                  <td className="print-td-badge">
                    <ValidationBadge pass={battery.mainCca != null ? battery.mainCca >= t.ccaMin : null} />
                  </td>
                </tr>
                <tr>
                  <td className="print-td-label">ค่า SOC</td>
                  <td className="print-td-value print-mono">{battery.mainSoc != null ? `${battery.mainSoc}%` : '-'}</td>
                  <td className="print-td-badge">
                    <ValidationBadge pass={battery.mainSoc != null ? battery.mainSoc === t.socTarget : null} />
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Defect Records */}
        {defects.length > 0 && (
          <div className="print-section">
            <h3 className="print-section-title">รายการจุดบกพร่อง (Defect Records)</h3>
            <table className="print-checklist-table">
              <thead>
                <tr>
                  <th className="w-[28px] text-center">#</th>
                  <th className="w-[72px] text-left">รหัสรายการ</th>
                  <th className="text-left">รายละเอียด</th>
                  <th className="w-[80px] text-center">ความรุนแรง</th>
                  <th className="w-[80px] text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {defects.map((defect: any, idx: number) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td className="print-mono text-[9px]">{defect.checklistItemCode || '-'}</td>
                    <td>{defect.description}</td>
                    <td className="text-center">{defect.severity}</td>
                    <td className={`text-center font-semibold ${defect.status === 'RESOLVED' ? 'text-green-700' : 'text-red-700'}`}>
                      {defect.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures */}
        <div className="print-signatures-section">
          <h3 className="print-section-title">ลายมือชื่อ (Signatures)</h3>
          <div className="print-signatures-grid print-sig-2col">

            {/* Inspector Signature */}
            <div className="print-sig-block">
              <div className="print-sig-canvas">
                {(() => {
                  const iSig = signatures?.inspector || job.inspectorSig || (job.inspector?.name ? getMockSignatureUrl(job.inspector.name) : null);
                  return iSig ? (
                    <img src={iSig} alt="Inspector Signature" className="print-sig-img" />
                  ) : (
                    <span className="print-sig-placeholder">— ไม่มีลายเซ็น —</span>
                  );
                })()}
              </div>
              <div className="print-sig-label">ช่างผู้ตรวจ: {job.inspector?.name || '________________'}</div>
            </div>

            {/* Supervisor Signature */}
            <div className="print-sig-block">
              <div className="print-sig-canvas">
                {(() => {
                  const sSig = signatures?.supervisor || job.supervisorSig || (job.approver?.name && job.status === 'APPROVED' ? getMockSignatureUrl(job.approver.name) : null);
                  return sSig ? (
                    <img src={sSig} alt="Supervisor Signature" className="print-sig-img" />
                  ) : (
                    <span className="print-sig-placeholder">— ไม่มีลายเซ็น —</span>
                  );
                })()}
              </div>
              <div className="print-sig-label">QC/Supervisor: {job.approver?.name || '________________'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer">
          <p>
            เอกสารนี้ออกโดยระบบ PDI Digital Inspection — Gold Integrate Co., Ltd. | พิมพ์เมื่อ{' '}
            {new Date().toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
