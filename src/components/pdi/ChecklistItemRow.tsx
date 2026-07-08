'use client';

import React from 'react';
import { Check, X, RefreshCw } from 'lucide-react';

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

interface ChecklistItemRowProps {
  item: ChecklistItem;
  res: ChecklistResult;
  readOnly: boolean;
  onResultChange: (itemId: string, itemCode: string, checkResult: 'PASS' | 'FAIL' | 'REPAIRED' | 'NA') => void;
  onNumericChange: (itemId: string, item: ChecklistItem, val: number | null) => void;
}

const ChecklistItemRow = React.memo(function ChecklistItemRow({
  item,
  res,
  readOnly,
  onResultChange,
  onNumericChange,
}: ChecklistItemRowProps) {
  return (
    <div className={`py-4 first:pt-0 last:pb-0 flex justify-between gap-4 ${item.hasNumeric ? 'flex-row items-center' : 'flex-col md:flex-row md:items-center'}`}>
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
            onClick={() => onResultChange(item.id, item.itemCode, 'PASS')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
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
            onClick={() => onResultChange(item.id, item.itemCode, 'FAIL')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
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
            onClick={() => onResultChange(item.id, item.itemCode, 'REPAIRED')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
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
            onClick={() => onResultChange(item.id, item.itemCode, 'NA')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
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
                  onNumericChange(item.id, item, val);
                }}
                className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
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
});

export default ChecklistItemRow;
