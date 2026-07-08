'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModelCode, MODEL_RULES, MODEL_NAMES, CHECKLIST_CATEGORIES } from '@/types/pdi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, X, RefreshCw, AlertCircle, Save, Send, ShieldAlert, ArrowLeft } from 'lucide-react';
import BatterySection from './BatterySection';
import DefectPanel from './DefectPanel';
import ChecklistItemRow from './ChecklistItemRow';
import DeliveryDocuments from './DeliveryDocuments';
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
  photoUrls?: string[];
  photoUrl?: string | null; // Legacy support
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
  vehicleVin: string;
  jobNumber: string;
  isApproved?: boolean;
  templateItems: ChecklistItem[];
  initialResults?: ChecklistResult[];
  initialBatteryData?: BatteryData;
  initialDefects?: Defect[];
  initialDocuments?: any[];
  onSave: (results: ChecklistResult[], battery: BatteryData, defects: Defect[]) => Promise<void>;
  onSubmit: (results: ChecklistResult[], battery: BatteryData, defects: Defect[]) => Promise<void>;
  readOnly?: boolean;
}

export default function ChecklistForm({
  jobId,
  modelCode,
  pdiType = 'INCOMING',
  vehicleVin,
  jobNumber,
  isApproved = false,
  templateItems,
  initialResults = [],
  initialBatteryData = {},
  initialDefects = [],
  initialDocuments = [],
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

  const handleResultChange = useCallback((itemId: string, itemCode: string, checkResult: 'PASS' | 'FAIL' | 'REPAIRED' | 'NA') => {
    if (readOnly) return;
    
    setResults(prev => {
      const current = prev[itemId] || { itemId, itemCode, result: 'PASS' };
      const updated = { ...current, result: checkResult };
      return {
        ...prev,
        [itemId]: updated
      };
    });

    // Business Rule: If result = FAIL, auto add/open a template defect
    if (checkResult === 'FAIL') {
      const item = templateItems.find(i => i.id === itemId);
      const itemName = item ? item.itemName : '';
      
      setDefects(prev => {
        const exists = prev.some(d => d.checklistItemCode === itemCode);
        if (!exists) {
          return [
            ...prev,
            {
              checklistItemCode: itemCode,
              description: `พบปัญหาบริเวณ: ${itemName}`,
              severity: 'NORMAL',
              status: 'OPEN',
            }
          ];
        }
        return prev;
      });
    }
  }, [readOnly, templateItems]);

  const handleNumericChange = useCallback((itemId: string, item: ChecklistItem, val: number | null) => {
    if (readOnly) return;

    setResults(prev => {
      const res = prev[itemId] || { itemId, itemCode: item.itemCode, result: 'PASS' };
      const updated = {
        ...res,
        numericValue: val,
      };
      
      // Auto-evaluate PASS/FAIL based on threshold
      if (val !== null && !isNaN(val)) {
        const passMin = item.numericMin == null || val >= item.numericMin;
        const passMax = item.numericMax == null || val <= item.numericMax;
        updated.result = (passMin && passMax) ? 'PASS' : 'FAIL';
      } else {
        updated.result = 'PASS';
      }

      return {
        ...prev,
        [itemId]: updated
      };
    });
  }, [readOnly]);

  const handleBatteryChange = useCallback((updater: any) => {
    setBatteryData(prev => {
      const nextBattery = typeof updater === 'function' ? updater(prev) : updater;
      
      // Update results in real-time for battery items
      setResults(prevResults => {
        const updatedResults = { ...prevResults };
        let changed = false;

        const syncField = (code: string, val: number | null | undefined) => {
          const item = templateItems.find(i => i.itemCode === code);
          if (item && updatedResults[item.id]) {
            const currentVal = updatedResults[item.id].numericValue;
            if (currentVal !== val) {
              const expectedResult = val !== null && val !== undefined ? (val >= (item.numericMin ?? 0) ? 'PASS' : 'FAIL') : 'PASS';
              updatedResults[item.id] = {
                ...updatedResults[item.id],
                numericValue: val,
                result: expectedResult
              };
              changed = true;
            }
          }
        };

        syncField('BAT_001', nextBattery.mainVoltage);
        syncField('BAT_002', nextBattery.mainSoh);
        syncField('BAT_003', nextBattery.secVoltage);
        syncField('BAT_004', nextBattery.secSoh);
        syncField('BAT_006', nextBattery.mainCca);
        syncField('BAT_007', nextBattery.mainSoc);
        syncField('BAT_008', nextBattery.tirePressure);

        const bat004hv = templateItems.find(i => i.itemCode === 'BAT_004' && i.itemName?.includes('HV'));
        if (bat004hv) {
          syncField('BAT_004', nextBattery.hvBatteryLevel);
        }

        if (nextBattery.terminalCheck) {
          const batTerm = templateItems.find(i => (i.itemCode === 'BAT_003' || i.itemCode === 'BAT_005') && !i.hasNumeric);
          if (batTerm && updatedResults[batTerm.id]) {
            const newResult = nextBattery.terminalCheck === 'N/A' ? 'NA' : nextBattery.terminalCheck as any;
            if (updatedResults[batTerm.id].result !== newResult) {
              updatedResults[batTerm.id] = { ...updatedResults[batTerm.id], result: newResult };
              changed = true;
            }
          }
        }

        return changed ? updatedResults : prevResults;
      });

      return nextBattery;
    });
  }, [templateItems]);

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
              ตรวจสอบรถรุ่น {MODEL_NAMES[modelCode] || modelCode.replace('_', ' ')}
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
              onChange={handleBatteryChange}
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
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      res={res}
                      readOnly={readOnly}
                      onResultChange={handleResultChange}
                      onNumericChange={handleNumericChange}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Defects Management Panel */}
          <DefectPanel
            jobId={jobId}
            defects={defects}
            onChange={setDefects}
            checklistItemCodes={templateItems.map(i => i.itemCode)}
            checklistItems={templateItems.map(i => ({ itemCode: i.itemCode, itemName: i.itemName }))}
            readOnly={readOnly}
          />

          {/* Delivery Documents Section (Only for PRE_DELIVERY PDI when approved) */}
          {pdiType === 'PRE_DELIVERY' && isApproved && (
            <DeliveryDocuments
              jobId={jobId}
              vin={vehicleVin}
              jobNumber={jobNumber}
              initialDocuments={initialDocuments}
              readOnly={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
