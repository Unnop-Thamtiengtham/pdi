'use client';

import React from 'react';
import { ModelCode, MODEL_RULES, BATTERY_THRESHOLDS } from '@/types/pdi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, CheckCircle, X, RefreshCw } from 'lucide-react';

interface BatteryData {
  mainVoltage?: number | null;
  mainSoh?: number | null;
  mainCca?: number | null;
  mainSoc?: number | null;
  secVoltage?: number | null;
  secSoh?: number | null;
  hvBatteryLevel?: number | null;
  tirePressure?: number | null;
  reportPhotoUrl?: string | null;
  terminalCheck?: string | null;
}

interface BatterySectionProps {
  modelCode: ModelCode;
  value: BatteryData;
  onChange: (data: BatteryData) => void;
  readOnly?: boolean;
}

export default function BatterySection({
  modelCode,
  value,
  onChange,
  readOnly = false,
}: BatterySectionProps) {
  const rules = MODEL_RULES[modelCode];
  const t = BATTERY_THRESHOLDS;

  const handleFieldChange = (field: keyof BatteryData, valStr: string) => {
    const numVal = valStr === '' ? null : parseFloat(valStr);
    onChange({
      ...value,
      [field]: numVal,
    });
  };

  // Helper validation checkers
  const isMainVoltageValid = value.mainVoltage !== undefined && value.mainVoltage !== null ? value.mainVoltage >= t.voltageMin : true;
  const isMainSohValid = value.mainSoh !== undefined && value.mainSoh !== null ? value.mainSoh >= t.sohMin : true;
  const isSecVoltageValid = value.secVoltage !== undefined && value.secVoltage !== null ? value.secVoltage >= t.voltageMin : true;
  const isSecSohValid = value.secSoh !== undefined && value.secSoh !== null ? value.secSoh >= t.sohMin : true;
  const isCcaValid = value.mainCca !== undefined && value.mainCca !== null ? value.mainCca >= t.ccaMin : true;
  const isSocValid = value.mainSoc !== undefined && value.mainSoc !== null ? value.mainSoc === t.socTarget : true;
  const isTirePressureValid =
    value.tirePressure !== undefined && value.tirePressure !== null
      ? value.tirePressure >= t.tirePressureMin && value.tirePressure <= t.tirePressureMax
      : true;
  const isHvValid =
    value.hvBatteryLevel !== undefined && value.hvBatteryLevel !== null
      ? value.hvBatteryLevel >= rules.hvBatteryMin
      : true;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-slate-800">ตรวจสอบระบบไฟฟ้าและลมยาง</CardTitle>
          <p className="text-xs text-slate-500 mt-1">เกณฑ์ขั้นต่ำเป็นไปตามข้อกำหนดของ GAC Thailand สำหรับรุ่น {modelCode.replace('_', ' ')}</p>
        </div>
        <Badge variant="outline" className="text-brand-teal border-brand-teal/30">
          {rules.hasDualBattery ? 'Dual Battery 12V' : 'Single Battery 12V'}
        </Badge>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main 12V Battery */}
        <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <h4 className="text-sm font-semibold text-brand-teal flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <span>แบตเตอรี่ 12V (ลูกหลัก)</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label className="text-xs text-slate-500 flex-1 flex items-end pb-1">แรงดันไฟฟ้า (Voltage)</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="เช่น 12.8"
                  value={value.mainVoltage !== undefined && value.mainVoltage !== null ? value.mainVoltage : ''}
                  onChange={(e) => handleFieldChange('mainVoltage', e.target.value)}
                  disabled={readOnly}
                  className={`pr-8 ${!isMainVoltageValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">V</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">เกณฑ์ &ge; {t.voltageMin}V</span>
                {value.mainVoltage !== undefined && value.mainVoltage !== null && (
                  isMainVoltageValid ? (
                    <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                  ) : (
                    <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ต่ำกว่าเกณฑ์</span>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <Label className="text-xs text-slate-500 flex-1 flex items-end pb-1">ค่าสุขภาพ SOH (State of Health)</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  placeholder="เช่น 95"
                  value={value.mainSoh !== undefined && value.mainSoh !== null ? value.mainSoh : ''}
                  onChange={(e) => handleFieldChange('mainSoh', e.target.value)}
                  disabled={readOnly}
                  className={`pr-8 ${!isMainSohValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">เกณฑ์ &ge; {t.sohMin}%</span>
                {value.mainSoh !== undefined && value.mainSoh !== null && (
                  isMainSohValid ? (
                    <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                  ) : (
                    <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ต่ำกว่าเกณฑ์</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Terminal Check - PASS/FAIL */}
          <div className="pt-3 border-t border-slate-200 mt-2">
            <Label className="text-xs text-slate-500 block mb-2">ขั้วลบแบตเตอรี่ขันแน่และไม่หลุดหลวม</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ ...value, terminalCheck: 'PASS' })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  value.terminalCheck === 'PASS'
                    ? 'bg-success/15 border-success text-success'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>PASS</span>
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ ...value, terminalCheck: 'FAIL' })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  value.terminalCheck === 'FAIL'
                    ? 'bg-danger/15 border-danger text-danger'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>FAIL</span>
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ ...value, terminalCheck: 'REPAIRED' })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  value.terminalCheck === 'REPAIRED'
                    ? 'bg-warning/15 border-warning text-warning'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REPAIRED</span>
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ ...value, terminalCheck: 'N/A' })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  value.terminalCheck === 'N/A'
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span>N/A</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary 12V Battery (AION V & HYPTEC HT) */}
        {rules.hasDualBattery && (
          <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="text-sm font-semibold text-brand-teal flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <span>แบตเตอรี่ 12V (ลูกรอง)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className="text-xs text-slate-500 flex-1 flex items-end pb-1">แรงดันไฟฟ้า (Voltage)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 12.7"
                    value={value.secVoltage !== undefined && value.secVoltage !== null ? value.secVoltage : ''}
                    onChange={(e) => handleFieldChange('secVoltage', e.target.value)}
                    disabled={readOnly}
                    className={`pr-8 ${!isSecVoltageValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">V</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">เกณฑ์ &ge; {t.voltageMin}V</span>
                  {value.secVoltage !== undefined && value.secVoltage !== null && (
                    isSecVoltageValid ? (
                      <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                    ) : (
                      <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ต่ำกว่าเกณฑ์</span>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <Label className="text-xs text-slate-500 flex-1 flex items-end pb-1">ค่าสุขภาพ SOH (State of Health)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    placeholder="เช่น 98"
                    value={value.secSoh !== undefined && value.secSoh !== null ? value.secSoh : ''}
                    onChange={(e) => handleFieldChange('secSoh', e.target.value)}
                    disabled={readOnly}
                    className={`pr-8 ${!isSecSohValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">เกณฑ์ &ge; {t.sohMin}%</span>
                  {value.secSoh !== undefined && value.secSoh !== null && (
                    isSecSohValid ? (
                      <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                    ) : (
                      <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ต่ำกว่าเกณฑ์</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Special AION Y Plus Rules */}
        {rules.hasCCA && (
          <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="text-sm font-semibold text-brand-teal flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <span>กระแสสตาร์ทเย็น & พลังงาน (CCA / SOC)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">ค่า CCA (หลัก)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    placeholder="เช่น 450"
                    value={value.mainCca !== undefined && value.mainCca !== null ? value.mainCca : ''}
                    onChange={(e) => handleFieldChange('mainCca', e.target.value)}
                    disabled={readOnly}
                    className={`pr-8 ${!isCcaValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">A</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">เกณฑ์ &ge; {t.ccaMin}A</span>
                  {value.mainCca !== undefined && value.mainCca !== null && (
                    isCcaValid ? (
                      <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                    ) : (
                      <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ต่ำกว่าเกณฑ์</span>
                    )
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500">ค่า SOC (หลัก)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    placeholder="เช่น 100"
                    value={value.mainSoc !== undefined && value.mainSoc !== null ? value.mainSoc : ''}
                    onChange={(e) => handleFieldChange('mainSoc', e.target.value)}
                    disabled={readOnly}
                    className={`pr-8 ${!isSocValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">เกณฑ์ = {t.socTarget}%</span>
                  {value.mainSoc !== undefined && value.mainSoc !== null && (
                    isSocValid ? (
                      <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                    ) : (
                      <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ไม่เป็น 100%</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* High Voltage Battery & Tire Pressure Check */}
        <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <h4 className="text-sm font-semibold text-brand-teal flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <span>แบตเตอรี่ขับเคลื่อน (HV) & ลมยาง</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500">ระดับแบตเตอรี่ HV</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  placeholder="เช่น 60"
                  value={value.hvBatteryLevel !== undefined && value.hvBatteryLevel !== null ? value.hvBatteryLevel : ''}
                  onChange={(e) => handleFieldChange('hvBatteryLevel', e.target.value)}
                  disabled={readOnly}
                  className={`pr-8 ${!isHvValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">เกณฑ์ &ge; {rules.hvBatteryMin}%</span>
                {value.hvBatteryLevel !== undefined && value.hvBatteryLevel !== null && (
                  isHvValid ? (
                    <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                  ) : (
                    <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> ต่ำกว่าเกณฑ์</span>
                  )
                )}
              </div>
            </div>

            {rules.hasTirePressure && (
              <div>
                <Label className="text-xs text-slate-500">แรงดันลมยางเฉลี่ย</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    placeholder="เช่น 36"
                    value={value.tirePressure !== undefined && value.tirePressure !== null ? value.tirePressure : ''}
                    onChange={(e) => handleFieldChange('tirePressure', e.target.value)}
                    disabled={readOnly}
                    className={`pr-10 ${!isTirePressureValid ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">psi</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">เกณฑ์ {t.tirePressureMin}-{t.tirePressureMax} psi</span>
                  {value.tirePressure !== undefined && value.tirePressure !== null && (
                    isTirePressureValid ? (
                      <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> ผ่าน</span>
                    ) : (
                      <span className="text-[10px] text-danger flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> นอกเกณฑ์กำหนด</span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
