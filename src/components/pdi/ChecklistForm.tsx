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
  terminalCheck?: string | null;
}

interface ChecklistFormProps {
  jobId: string;
  modelCode: ModelCode;
  pdiType?: string;
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
  pdiType = 'INCOMING',
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
  const [batteryData, setBatteryData] = useState<BatteryData>(() => {
    const data = { ...initialBatteryData };
    
    // Sync with initial results if present
    const batTerm = templateItems.find(i => (i.itemCode === 'BAT_003' || i.itemCode === 'BAT_005') && !i.hasNumeric);
    if (batTerm) {
      const savedResult = initialResults.find(r => r.itemId === batTerm.id || r.itemCode === batTerm.itemCode);
      if (savedResult) {
        data.terminalCheck = savedResult.result === 'NA' ? 'N/A' : savedResult.result;
      }
    }

    if (data.terminalCheck === undefined || data.terminalCheck === null) {
      data.terminalCheck = 'PASS';
    }
    return data;
  });
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

  // Map categoryOrder → code, falling back to the category name from the item itself
  const getCategoryCode = (item: ChecklistItem) => {
    // First try matching by exact category name
    const byName = CHECKLIST_CATEGORIES.find(cat => cat.name === item.category);
    if (byName) return byName.code;
    // Then try matching by categoryOrder
    const byOrder = CHECKLIST_CATEGORIES.find(cat => cat.order === item.categoryOrder);
    if (byOrder) return byOrder.code;
    // Final fallback: use categoryOrder as a unique key
    return `CAT_${item.categoryOrder}`;
  };

  // Group items by category using categoryOrder for reliable matching
  const getCategoryName = (code: string) => {
    const found = CHECKLIST_CATEGORIES.find(c => c.code === code);
    if (found) return found.name;
    // For dynamic CAT_N codes, find the category name from template items
    const item = templateItems.find(i => getCategoryCode(i) === code);
    return item ? item.category : code;
  };

  const categories = Array.from(new Set(templateItems.map(i => getCategoryCode(i))));

  // Select first available category if activeCategory is not in the categories list (e.g. for LONG_TERM jobs)
  useEffect(() => {
    if (categories.length > 0 && !(categories as string[]).includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const filteredItems = templateItems.filter(item => getCategoryCode(item) === activeCategory);

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
    // Use functional update to avoid stale closure + infinite loop with `results` in deps
    setResults(prev => {
      const updatedResults = { ...prev };
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

      // For AION_UT: BAT_004 is HV battery level, not secSoh
      const bat004hv = templateItems.find(i => i.itemCode === 'BAT_004' && i.itemName?.includes('HV'));
      if (bat004hv) {
        syncField('BAT_004', batteryData.hvBatteryLevel);
      }

      // Sync terminalCheck (PASS/FAIL) to the non-numeric battery terminal check item (BAT_003 or BAT_005)
      if (batteryData.terminalCheck) {
        const batTerm = templateItems.find(i => (i.itemCode === 'BAT_003' || i.itemCode === 'BAT_005') && !i.hasNumeric);
        if (batTerm && updatedResults[batTerm.id]) {
          const newResult = batteryData.terminalCheck === 'N/A' ? 'NA' : batteryData.terminalCheck as 'PASS' | 'FAIL' | 'REPAIRED';
          if (updatedResults[batTerm.id].result !== newResult) {
            updatedResults[batTerm.id] = { ...updatedResults[batTerm.id], result: newResult };
            changed = true;
          }
        }
      }

      return changed ? updatedResults : prev;
    });
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
    // 2. Battery values checklist validation (skip for LONG_TERM since it uses standard checklist items instead of custom BatterySection inputs)
    if (pdiType !== 'LONG_TERM') {
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
    }

    setSubmitting(true);
    try {
      await onSubmit(Object.values(results), batteryData, defects);
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
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase pl-2 hidden lg:block">หมวดการตรวจสอบ</span>
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible whitespace-nowrap lg:whitespace-normal gap-2 lg:gap-1 pb-2 lg:pb-0 scrollbar-none">
            {categories.map((catCode) => {
              const isActive = activeCategory === catCode;
              const catItems = templateItems.filter(i => getCategoryCode(i) === catCode);
              
              // Count PASS/REPAIRED/NA items in this category
              const passInCat = catItems.filter(i => results[i.id]?.result === 'PASS' || results[i.id]?.result === 'REPAIRED' || results[i.id]?.result === 'NA').length;
              const totalInCat = catItems.length;
              const hasFailInCat = catItems.some(i => results[i.id]?.result === 'FAIL');
              const isCatDone = passInCat === totalInCat;

              return (
                <button
                  key={catCode}
                  type="button"
                  onClick={() => setActiveCategory(catCode)}
                  className={`flex-shrink-0 w-auto lg:w-full text-left px-3 py-2 lg:py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between gap-3 cursor-pointer border min-w-[130px] lg:min-w-0 ${
                    isActive
                      ? 'bg-brand-teal/10 border-brand-teal text-brand-teal glow-active font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{getCategoryName(catCode)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    hasFailInCat ? 'bg-error/15 text-error' : isCatDone ? 'bg-success/20 text-success' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {passInCat}/{totalInCat}
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
                    <div key={item.id} className={`py-4 first:pt-0 last:pb-0 flex justify-between gap-4 ${item.hasNumeric ? 'flex-row items-center' : 'flex-col md:flex-row md:items-center'}`}>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-brand-teal font-semibold">{item.itemCode}</span>
                          <h4 className="text-sm font-medium text-slate-800">{item.itemName}</h4>
                        </div>
                        {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                      </div>

                      {/* Result Selectors (hidden for numeric-input items) */}
                      {!item.hasNumeric && (
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
                      )}

                      {/* Numeric Input (for items with hasNumeric) */}
                      {item.hasNumeric && (
                        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                          <div className="relative">
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                disabled={readOnly}
                                placeholder={`เช่น ${item.numericMin ?? 0}`}
                                value={res.numericValue ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                  const updated = {
                                    ...res,
                                    numericValue: val,
                                  };
                                  // Auto-evaluate PASS/FAIL based on threshold
                                  if (val !== null && !isNaN(val)) {
                                    const passMin = item.numericMin == null || val >= item.numericMin;
                                    const passMax = item.numericMax == null || val <= item.numericMax;
                                    updated.result = (passMin && passMax) ? 'PASS' : 'FAIL';
                                  }
                                  setResults(prev => ({ ...prev, [item.id]: updated }));
                                }}
                                className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all"
                              />
                              {item.numericUnit && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                  {item.numericUnit}
                                </span>
                              )}
                            </div>
                            <p className="absolute left-0 top-full mt-0.5 text-[10px] text-slate-400 whitespace-nowrap">
                              เกณฑ์ ≥ {item.numericMin ?? 0}{item.numericUnit ?? ''}
                            </p>
                          </div>
                          {/* Auto-result badge */}
                          {res.numericValue != null && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              res.result === 'PASS' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                            }`}>
                              {res.result}
                            </span>
                          )}
                        </div>
                      )}
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
            checklistItems={templateItems.map(i => ({ itemCode: i.itemCode, itemName: i.itemName }))}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
