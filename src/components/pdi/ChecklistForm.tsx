'use client';

import React, { useState, useEffect } from 'react';
import { ModelCode, MODEL_RULES, CHECKLIST_CATEGORIES } from '@/types/pdi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, X, RefreshCw, AlertCircle, Save, Send, ShieldAlert, ArrowLeft } from 'lucide-react';
import BatterySection from './BatterySection';
import DefectPanel from './DefectPanel';
import Link from 'next/link';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  category: string;
  categoryOrder: number;
  itemCode: string;
  itemName: string;
  itemOrder: number;
  isMandatory: boolean;
  hasPhoto: boolean;
  hasNumeric: boolean;
  numericUnit?: string | null;
  numericMin?: number | null;
  numericMax?: number | null;
  notes?: string | null;
}

interface ChecklistResult {
  itemId: string;
  itemCode: string;
  result: 'PASS' | 'FAIL' | 'REPAIRED' | 'NA';
  numericValue?: number | null;
  numericValue2?: number | null;
  photoUrl?: string | null;
  remark?: string | null;
}

interface Defect {
  id?: string;
  checklistItemCode?: string | null;
  description: string;
  severity: string;
  status: string;
  photoUrl?: string | null;
}

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
}

interface ChecklistFormProps {
  jobId: string;
  modelCode: ModelCode;
  templateItems: ChecklistItem[];
  initialResults?: ChecklistResult[];
  initialBatteryData?: BatteryData;
  initialDefects?: Defect[];
  onSave: (results: ChecklistResult[], battery: BatteryData, defects: Defect[]) => Promise<void>;
  onSubmit: (results: ChecklistResult[], battery: BatteryData, defects: Defect[]) => Promise<void>;
  readOnly?: boolean;
}

export default function ChecklistForm({
  jobId,
  modelCode,
  templateItems,
  initialResults = [],
  initialBatteryData = {},
  initialDefects = [],
  onSave,
  onSubmit,
  readOnly = false,
}: ChecklistFormProps) {
  // State management
  const [results, setResults] = useState<Record<string, ChecklistResult>>({});
  const [batteryData, setBatteryData] = useState<BatteryData>(initialBatteryData);
  const [defects, setDefects] = useState<Defect[]>(initialDefects);
  const [activeCategory, setActiveCategory] = useState<string>('EXTERIOR');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load initial results
  useEffect(() => {
    const resMap: Record<string, ChecklistResult> = {};
    
    // Initialize with template defaults (all pass initially)
    templateItems.forEach(item => {
      resMap[item.id] = {
        itemId: item.id,
        itemCode: item.itemCode,
        result: 'PASS',
        numericValue: null,
        numericValue2: null,
        photoUrl: null,
        remark: null,
      };
    });

    // Merge actual initial results
    initialResults.forEach(r => {
      resMap[r.itemId] = {
        ...resMap[r.itemId],
        ...r,
      };
    });

    setResults(resMap);
  }, [templateItems, initialResults]);

  // Group items by category (matched with category names)
  const getCategoryName = (code: string) => {
    const found = CHECKLIST_CATEGORIES.find(c => c.code === code);
    return found ? found.name : code;
  };

  const categories = Array.from(new Set(templateItems.map(i => {
    const matched = CHECKLIST_CATEGORIES.find(cat => cat.name === i.category);
    return matched ? matched.code : 'EXTERIOR';
  })));

  const filteredItems = templateItems.filter(item => {
    const matched = CHECKLIST_CATEGORIES.find(cat => cat.name === item.category);
    return (matched ? matched.code : 'EXTERIOR') === activeCategory;
  });

  const handleResultChange = (itemId: string, itemCode: string, checkResult: 'PASS' | 'FAIL' | 'REPAIRED' | 'NA') => {
    if (readOnly) return;
    
    const current = results[itemId] || { itemId, itemCode, result: 'PASS' };
    const updated = { ...current, result: checkResult };
    
    setResults(prev => ({
      ...prev,
      [itemId]: updated
    }));

    // Business Rule: If result = FAIL, auto add/open a template defect
    if (checkResult === 'FAIL') {
      const item = templateItems.find(i => i.id === itemId);
      const itemName = item ? item.itemName : '';
      
      // Check if already in defects
      const exists = defects.some(d => d.checklistItemCode === itemCode);
      if (!exists) {
        setDefects(prev => [
          ...prev,
          {
            checklistItemCode: itemCode,
            description: `พบปัญหาบริเวณ: ${itemName}`,
            severity: 'NORMAL',
            status: 'OPEN',
          }
        ]);
      }
    }
  };

  // Sync battery details into the results list where applicable
  useEffect(() => {
    // Sync battery fields to checklist items with matching codes
    // BAT_001 -> mainVoltage, BAT_002 -> mainSoh, BAT_003 -> secVoltage, BAT_004 -> secSoh, BAT_006 -> mainCca, BAT_007 -> mainSoc, BAT_008 -> tirePressure
    const updatedResults = { ...results };
    let changed = false;

    const syncField = (code: string, val: number | null | undefined) => {
      const item = templateItems.find(i => i.itemCode === code);
      if (item && updatedResults[item.id] && updatedResults[item.id].numericValue !== val) {
        updatedResults[item.id] = {
          ...updatedResults[item.id],
          numericValue: val,
          result: val !== null && val !== undefined ? (val >= (item.numericMin ?? 0) ? 'PASS' : 'FAIL') : 'PASS'
        };
        changed = true;
      }
    };

    syncField('BAT_001', batteryData.mainVoltage);
    syncField('BAT_002', batteryData.mainSoh);
    syncField('BAT_003', batteryData.secVoltage);
    syncField('BAT_004', batteryData.secSoh);
    syncField('BAT_006', batteryData.mainCca);
    syncField('BAT_007', batteryData.mainSoc);
    syncField('BAT_008', batteryData.tirePressure);

    if (changed) {
      setResults(updatedResults);
    }
  }, [batteryData, templateItems]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSave(Object.values(results), batteryData, defects);
      toast.success('บันทึกแบบร่างสำเร็จ');
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกแบบร่าง');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitJob = async () => {
    // 1. Defect Block: If any defect is OPEN, cannot submit
    const openDefects = defects.filter(d => d.status === 'OPEN' || d.status === 'IN_REPAIR');
    if (openDefects.length > 0) {
      toast.warning('ไม่สามารถส่งตรวจได้: ยังมีจุดบกพร่องที่ค้างชำรุด (OPEN / IN REPAIR) ต้องดำเนินการแก้ไขหรือเปลี่ยนสถานะเป็น RESOLVED ก่อนส่งตรวจ');
      return;
    }

    // 2. Battery values checklist validation
    const rules = MODEL_RULES[modelCode];
    if (batteryData.mainVoltage === undefined || batteryData.mainVoltage === null || batteryData.mainSoh === undefined || batteryData.mainSoh === null) {
      toast.warning('กรุณากรอกข้อมูลแบตเตอรี่ 12V (แรงดันไฟฟ้าและ SOH)');
      return;
    }
    if (rules.hasDualBattery && (batteryData.secVoltage === undefined || batteryData.secVoltage === null || batteryData.secSoh === undefined || batteryData.secSoh === null)) {
      toast.warning('กรุณากรอกข้อมูลแบตเตอรี่ 12V ลูกรอง (แรงดันไฟฟ้าและ SOH)');
      return;
    }
    if (rules.hasCCA && (batteryData.mainCca === undefined || batteryData.mainCca === null)) {
      toast.warning('กรุณากรอกข้อมูล CCA แบตเตอรี่สำหรับรุ่น AION Y Plus');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(Object.values(results), batteryData, defects);
      toast.success('ส่งผลงานตรวจให้ Supervisor พิจารณาเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการส่งตรวจ');
    } finally {
      setSubmitting(false);
    }
  };

  // Progress metrics calculation
  const totalCount = templateItems.length;
  const checkedCount = Object.values(results).filter(r => r.result).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top sticky actions block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link href="/pdi/incoming">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">PDI Inspection Form</span>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              ตรวจสอบรถรุ่น {modelCode.replace('_', ' ')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!readOnly && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="gap-1.5"
              >
                <Save className="w-4 h-4 text-slate-600" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง (Draft)'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitJob}
                disabled={saving || submitting}
                className="gap-1.5"
              >
                <Send className="w-4 h-4 text-slate-950" />
                {submitting ? 'กำลังส่งตรวจ...' : 'ส่งอนุมัติ (Submit)'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 no-print">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-500">ภาพรวมความคืบหน้าการตรวจ</span>
          <span className="text-brand-teal">{checkedCount} / {totalCount} รายการ ({progressPercent}%)</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal transition-all duration-300 shadow-[0_0_8px_rgba(48,192,208,0.3)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Categories list */}
        <div className="lg:col-span-1 space-y-1.5 no-print">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase pl-2">หมวดการตรวจสอบ</span>
          <div className="space-y-1">
            {categories.map((catCode) => {
              const isActive = activeCategory === catCode;
              const catItems = templateItems.filter(i => {
                const matched = CHECKLIST_CATEGORIES.find(c => c.name === i.category);
                return (matched ? matched.code : 'EXTERIOR') === catCode;
              });
              
              // Count checked in this category
              const checkedInCat = catItems.filter(i => results[i.id]?.result).length;
              const totalInCat = catItems.length;
              const isCatDone = checkedInCat === totalInCat;

              return (
                <button
                  key={catCode}
                  type="button"
                  onClick={() => setActiveCategory(catCode)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                    isActive
                      ? 'bg-brand-teal/10 border-brand-teal text-brand-teal glow-active font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{getCategoryName(catCode)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isCatDone ? 'bg-success/20 text-success' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {checkedInCat}/{totalInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Diagnostic electrical panel (Category 9 helper) */}
          {activeCategory === 'BATTERY_12V' ? (
            <BatterySection
              modelCode={modelCode}
              value={batteryData}
              onChange={setBatteryData}
              readOnly={readOnly}
            />
          ) : (
            // Standard category items
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{getCategoryName(activeCategory)}</CardTitle>
                <p className="text-xs text-slate-500">ทำเครื่องหมายผ่าน หรือ บันทึกปัญหา หากไม่เป็นไปตามมาตรฐาน</p>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const res = results[item.id] || { itemId: item.id, itemCode: item.itemCode, result: 'PASS' };
                  
                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-brand-teal font-semibold">{item.itemCode}</span>
                          <h4 className="text-sm font-medium text-slate-800">{item.itemName}</h4>
                        </div>
                        {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                      </div>

                      {/* Result Selectors */}
                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto justify-start md:justify-end">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => handleResultChange(item.id, item.itemCode, 'PASS')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            res.result === 'PASS'
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
                          onClick={() => handleResultChange(item.id, item.itemCode, 'FAIL')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            res.result === 'FAIL'
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
                          onClick={() => handleResultChange(item.id, item.itemCode, 'REPAIRED')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            res.result === 'REPAIRED'
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
                          onClick={() => handleResultChange(item.id, item.itemCode, 'NA')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            res.result === 'NA'
                              ? 'bg-slate-100 border-slate-200 text-slate-600'
                              : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                          }`}
                        >
                          <span>N/A</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Defects Management Panel */}
          <DefectPanel
            defects={defects}
            onChange={setDefects}
            checklistItemCodes={templateItems.map(i => i.itemCode)}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
