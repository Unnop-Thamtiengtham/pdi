'use client';

import React, { createContext, useContext } from 'react';

export interface ChecklistResult {
  itemId: string;
  itemCode: string;
  result: 'PASS' | 'FAIL' | 'REPAIRED' | 'NA';
  numericValue?: number | null;
  numericValue2?: number | null;
  photoUrl?: string | null;
  remark?: string | null;
}

export interface ChecklistItem {
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

interface PdiWorkspaceContextType {
  results: Record<string, ChecklistResult>;
  readOnly: boolean;
  onResultChange: (itemId: string, itemCode: string, checkResult: 'PASS' | 'FAIL' | 'REPAIRED' | 'NA') => void;
  onNumericChange: (itemId: string, item: ChecklistItem, val: number | null) => void;
}

const PdiWorkspaceContext = createContext<PdiWorkspaceContextType | undefined>(undefined);

export function PdiWorkspaceProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PdiWorkspaceContextType;
}) {
  return (
    <PdiWorkspaceContext.Provider value={value}>
      {children}
    </PdiWorkspaceContext.Provider>
  );
}

export function usePdiWorkspaceContext() {
  const context = useContext(PdiWorkspaceContext);
  if (context === undefined) {
    throw new Error('usePdiWorkspaceContext must be used within a PdiWorkspaceProvider');
  }
  return context;
}
