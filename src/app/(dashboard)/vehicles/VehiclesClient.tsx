'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Car, Calendar, Sliders, ChevronRight, Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Play, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface VehiclesClientProps {
  initialVehicles: any[];
  branches: any[];
  isDbConnected: boolean;
}

const pdiStatusMap: Record<string, string> = {
  PENDING: 'รอตรวจ',
  IN_PROGRESS: 'กำลังตรวจ',
  PENDING_APPROVAL: 'รอ QC',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ถูก Reject',
};

const formatWorksheet = (XLSX: any, ws: any, hasHeader = true, fontName = 'Segoe UI') => {
  if (!ws || !ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cols: any[] = [];

  const isSarabun = fontName === 'TH Sarabun New';
  const defaultSize = isSarabun ? 14 : 10;
  const headerSize = isSarabun ? 16 : 11;
  const monoSize = isSarabun ? 13 : 9.5;

  // Initialize column widths with default 15
  for (let C = range.s.c; C <= range.e.c; ++C) {
    cols.push({ wch: 15 });
  }

  for (const cellRef in ws) {
    if (cellRef.startsWith('!')) continue;
    const cell = ws[cellRef];
    if (!cell) continue;

    const cellDecoded = XLSX.utils.decode_cell(cellRef);
    const row = cellDecoded.r;
    const col = cellDecoded.c;

    // Find the header text for this column
    const headerCellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    const headerText = ws[headerCellRef]?.v ? String(ws[headerCellRef].v).toLowerCase() : '';

    // Auto-calculate column width
    const textVal = cell.v ? String(cell.v) : '';
    const len = textVal.split('').reduce((acc: number, char: string) => {
      return acc + (char.charCodeAt(0) > 127 ? 1.5 : 1);
    }, 0);

    if (len > (cols[col].wch - 3)) {
      cols[col].wch = Math.min(Math.ceil(len + 4), 40);
    }

    // Default style
    const style: any = {
      font: { name: fontName, sz: defaultSize, color: { rgb: '334155' } },
      alignment: { vertical: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      }
    };

    // Header styling
    if (hasHeader && row === 0) {
      style.font = { name: fontName, sz: headerSize, bold: true, color: { rgb: '1E293B' } };
      style.fill = { fgColor: { rgb: 'F1F5F9' } }; // slate-100
      style.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      style.border = {
        bottom: { style: 'medium', color: { rgb: '94A3B8' } }, // slate-400
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };
    } else {
      // Cell styling based on header name
      if (headerText.includes('vin') || headerText.includes('ตัวถัง')) {
        style.font = { name: isSarabun ? fontName : 'Consolas', sz: defaultSize, bold: true, color: { rgb: '0F172A' } };
        style.alignment = { horizontal: 'center', vertical: 'center' };
      } 
      else if (headerText.includes('code') || headerText.includes('รหัส')) {
        style.font = { name: isSarabun ? fontName : 'Consolas', sz: monoSize, color: { rgb: '475569' } };
        if (headerText.includes('branch') || headerText.includes('สาขา')) {
          style.alignment = { horizontal: 'center', vertical: 'center' };
        }
      } 
      else if (headerText.includes('year') || headerText.includes('date') || headerText.includes('ปี') || headerText.includes('วัน')) {
        style.alignment = { horizontal: 'center', vertical: 'center' };
      } 
      else if (headerText.includes('status') || headerText.includes('สถานะ')) {
        style.alignment = { horizontal: 'center', vertical: 'center' };
        
        const v = String(cell.v);
        if (v.includes('อนุมัติแล้ว') || v.includes('ใน Stock')) {
          style.font.bold = true;
          style.font.color = { rgb: '166534' }; // green-800
          style.fill = { fgColor: { rgb: 'DCFCE7' } }; // green-100
        } else if (v.includes('ถูก Reject') || v.includes('ส่งมอบแล้ว')) {
          style.font.bold = true;
          style.font.color = { rgb: '991B1B' }; // red-800
          style.fill = { fgColor: { rgb: 'FEE2E2' } }; // red-100
        } else if (v.includes('กำลังตรวจ')) {
          style.font.bold = true;
          style.font.color = { rgb: '0F766E' }; // teal-800
          style.fill = { fgColor: { rgb: 'CCFBF1' } }; // teal-100
        } else if (v.includes('รอ QC')) {
          style.font.bold = true;
          style.font.color = { rgb: '92400E' }; // amber-800
          style.fill = { fgColor: { rgb: 'FEF3C7' } }; // amber-100
        } else if (v.includes('รอตรวจ')) {
          style.font.bold = true;
          style.font.color = { rgb: '475569' }; // slate-600
          style.fill = { fgColor: { rgb: 'F1F5F9' } }; // slate-100
        }
      }
    }

    cell.s = style;
  }

  ws['!cols'] = cols;

  const rows: any[] = [];
  for (let R = range.s.r; R <= range.e.r; ++R) {
    rows.push({ hpt: R === 0 ? (isSarabun ? 34 : 28) : (isSarabun ? 26 : 22) });
  }
  ws['!rows'] = rows;
};

export default function VehiclesClient({ initialVehicles, branches, isDbConnected }: VehiclesClientProps) {
  const [vehicles, setVehicles] = useState(
    isDbConnected
      ? initialVehicles
      : [
          {
            vin: 'LNAT4AB34T5G05011',
            modelCode: 'AION_V',
            modelName: 'AION V',
            colorName: 'Space Gray',
            exteriorColor: 'Gray Metallic',
            interiorColor: 'Coal Black',
            productionYear: 2026,
            wsDate: '2026-05-10T00:00:00.000Z',
            currentStatus: 'IN_STOCK',
            warehouse: 'Main Dock',
            floorplan: 'Zone A',
            arrivedAt: '2026-06-08T12:00:00.000Z',
            branch: { name: 'Aion มีนบุรี' },
            pdiJobs: [{ id: 'mock-1', pdiType: 'INCOMING', status: 'PENDING' }],
          },
          {
            vin: 'LNAT4AB34T5G05022',
            modelCode: 'HYPTEC_HT',
            modelName: 'HYPTEC HT',
            colorName: 'Rose Gold',
            exteriorColor: 'Rose Gold Satin',
            interiorColor: 'Cream White',
            productionYear: 2026,
            wsDate: '2026-05-15T00:00:00.000Z',
            currentStatus: 'IN_STOCK',
            warehouse: 'Rooftop Lot',
            floorplan: 'Zone B',
            arrivedAt: '2026-06-09T08:00:00.000Z',
            branch: { name: 'Aion มีนบุรี' },
            pdiJobs: [{ id: 'mock-2', pdiType: 'INCOMING', status: 'PENDING_APPROVAL' }],
          },
        ]
  );

  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vin, setVin] = useState('');
  const [modelCode, setModelCode] = useState('AION_V');
  const [colorName, setColorName] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [productionYear, setProductionYear] = useState('2026');
  const [wsDate, setWsDate] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'mock-branch');
  const [warehouse, setWarehouse] = useState('');
  const [floorplan, setFloorplan] = useState('');
  const [loading, setLoading] = useState(false);

  // Excel Import & Export States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importVehicles, setImportVehicles] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVins, setSelectedVins] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOMING' | 'LONG_TERM' | 'PRE_DELIVERY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered dataset based on activeTab and searchQuery
  const filteredVehicles = vehicles.filter((veh) => {
    // 1. Filter by PDI Job Type of the latest job
    const latestJob = veh.pdiJobs?.[0];
    if (activeTab !== 'ALL') {
      if (!latestJob || latestJob.pdiType !== activeTab) {
        return false;
      }
    }

    // 2. Filter by search text query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const vinMatch = veh.vin.toLowerCase().includes(q);
      const modelMatch = (veh.modelName || '').toLowerCase().includes(q);
      const branchMatch = (veh.branch?.name || '').toLowerCase().includes(q);
      const warehouseMatch = (veh.warehouse || '').toLowerCase().includes(q);
      const floorplanMatch = (veh.floorplan || '').toLowerCase().includes(q);
      
      return vinMatch || modelMatch || branchMatch || warehouseMatch || floorplanMatch;
    }

    return true;
  });

  const handleExportExcel = async () => {
    const XLSX = (await import('xlsx-js-style')).default;
    const exportData = filteredVehicles.map(v => {
      const latestJob = v.pdiJobs?.[0];
      const pdiStatusStr = latestJob 
        ? `${latestJob.pdiType}: ${pdiStatusMap[latestJob.status] || latestJob.status}` 
        : 'ไม่มีงานตรวจ';
      return {
        'เลขตัวถัง (VIN)': v.vin,
        'รุ่นโมเดล (Model)': v.modelName || v.modelCode,
        'รหัสรุ่น (Model Code)': v.modelCode,
        'สีหลัก (Color)': v.colorName,
        'ลักษณะสีภายนอก (Exterior Color)': v.exteriorColor || '',
        'โทนสีภายใน (Interior Color)': v.interiorColor || '',
        'ปีที่ผลิต (Year)': v.productionYear || '',
        'วันที่ขายส่ง (WSDate)': v.wsDate ? new Date(v.wsDate).toLocaleDateString('th-TH') : '',
        'วันที่เข้าคลัง (Arrived)': v.arrivedAt ? new Date(v.arrivedAt).toLocaleDateString('th-TH') : '',
        'คลังสินค้า (Warehouse)': v.warehouse || '',
        'ตำแหน่งจอด (Floorplan)': v.floorplan || '',
        'สาขา (Branch)': v.branch?.name || '',
        'สถานะสต็อก (Stock Status)': v.currentStatus === 'IN_STOCK' ? 'ใน Stock' : 'ส่งมอบแล้ว',
        'สถานะ PDI (PDI Status)': pdiStatusStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    formatWorksheet(XLSX, ws);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    XLSX.writeFile(wb, `pdi_vehicles_stock_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDownloadTemplate = async () => {
    const XLSX = (await import('xlsx-js-style')).default;
    const templateData = [
      {
        'เลขตัวถัง': 'LNAT4AB34T5G00001',
        'รหัสรุ่น': 'AION_V',
        'สีหลัก': 'Space Gray',
        'สีภายนอก': 'Gray Metallic',
        'สีภายใน': 'Coal Black',
        'ปีผลิต': 2026,
        'วันที่ขายส่ง': '2026-06-23',
        'โกดัง': 'คลังท่าเรือแหลมฉบัง',
        'ตำแหน่งจอด': 'Zone A-3',
        'รหัสสาขา': 'MBR'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    formatWorksheet(XLSX, ws, true, 'TH Sarabun New');

    // Create a reference sheet showing all valid branch codes and model codes
    const modelCodes = [
      { code: 'AION_V', name: 'AION V' },
      { code: 'AION_V5', name: 'AION V 5' },
      { code: 'AION_UT', name: 'AION UT' },
      { code: 'AION_YP', name: 'AION Y Plus' },
      { code: 'AION_YP5', name: 'AION Y Plus 5' },
      { code: 'AION_ES', name: 'AION ES' },
      { code: 'HYPTEC_HT', name: 'HYPTEC HT' },
      { code: 'HYPTEC_SSR', name: 'HYPTEC SSR' },
      { code: 'GAC_M8', name: 'GAC M8' },
    ];

    const dbBranches = branches && branches.length > 0 ? branches : [{ code: 'MBR', name: 'มีนบุรี' }];
    const maxRows = Math.max(dbBranches.length, modelCodes.length);
    const referenceData = [];

    for (let i = 0; i < maxRows; i++) {
      const branch = dbBranches[i];
      const model = modelCodes[i];
      referenceData.push({
        'รหัสสาขา (Branch Code)': branch ? branch.code : '',
        'ชื่อสาขา (Branch Name)': branch ? branch.name : '',
        ' ': '',
        'รหัสรุ่น (Model Code)': model ? model.code : '',
        'ชื่อรุ่น (Model Name)': model ? model.name : '',
      });
    }

    const wsRef = XLSX.utils.json_to_sheet(referenceData);
    formatWorksheet(XLSX, wsRef, true, 'TH Sarabun New');

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, wsRef, 'Reference_Data');
    XLSX.writeFile(wb, 'pdi_import_vehicles_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = (await import('xlsx-js-style')).default;
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rawRows.length === 0) {
          toast.error('ไม่พบข้อมูลรถยนต์ในไฟล์ Excel');
          return;
        }

        const parsedRows = rawRows.map(row => ({
          vin: row.vin || row['เลขตัวถัง'] || row['VIN'] || '',
          modelCode: row.modelCode || row['รหัสรุ่น'] || row['Model Code'] || '',
          colorName: row.colorName || row['สีหลัก'] || row['Color'] || '',
          exteriorColor: row.exteriorColor || row['สีภายนอก'] || row['Exterior Color'] || '',
          interiorColor: row.interiorColor || row['สีภายใน'] || row['Interior Color'] || '',
          productionYear: row.productionYear || row['ปีผลิต'] || row['Year'] || '',
          wsDate: row.wsDate || row['วันที่ขายส่ง'] || row['WSDate'] || '',
          warehouse: row.warehouse || row['โกดัง'] || row['Warehouse'] || '',
          floorplan: row.floorplan || row['ตำแหน่งจอด'] || row['Floorplan'] || '',
          branchCode: row.branchCode || row['รหัสสาขา'] || row['Branch Code'] || '',
        }));

        const clientErrors: string[] = [];
        const validModelCodes = ['AION_V', 'AION_V5', 'AION_UT', 'AION_YP', 'AION_YP5', 'AION_ES', 'HYPTEC_HT', 'HYPTEC_SSR', 'GAC_M8'];
        const branchCodesInDb = branches.map(b => b.code.toUpperCase());
        const existingVinsInDb = new Set(vehicles.map(v => v.vin.toUpperCase()));
        const seenVins = new Set<string>();

        parsedRows.forEach((row, idx) => {
          const rowNum = idx + 1;
          
          if (!row.vin) {
            clientErrors.push(`แถวที่ ${rowNum}: ไม่มีเลขตัวถัง (VIN)`);
          } else {
            const vinUpper = String(row.vin).trim().toUpperCase();
            if (existingVinsInDb.has(vinUpper)) {
              clientErrors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${row.vin}" มีอยู่ในระบบแล้ว`);
            }
            if (seenVins.has(vinUpper)) {
              clientErrors.push(`แถวที่ ${rowNum}: เลขตัวถัง (VIN) "${row.vin}" ซ้ำกับรายการอื่นในไฟล์`);
            }
            seenVins.add(vinUpper);
          }

          if (!row.modelCode) {
            clientErrors.push(`แถวที่ ${rowNum}: ไม่มีรหัสรุ่นรถ (modelCode)`);
          } else if (!validModelCodes.includes(String(row.modelCode).trim())) {
            clientErrors.push(`แถวที่ ${rowNum}: รหัสรุ่น "${row.modelCode}" ไม่ถูกต้อง (เลือกได้เฉพาะ: AION_V, AION_V5, AION_UT, AION_YP, AION_YP5, AION_ES, HYPTEC_HT, HYPTEC_SSR, GAC_M8)`);
          }

          if (!row.colorName) {
            clientErrors.push(`แถวที่ ${rowNum}: ไม่มีสีหลักภายนอก (colorName)`);
          }

          if (!row.branchCode) {
            clientErrors.push(`แถวที่ ${rowNum}: ไม่มีรหัสสาขา (branchCode)`);
          } else {
            const bCode = String(row.branchCode).trim().toUpperCase();
            if (isDbConnected && !branchCodesInDb.includes(bCode)) {
              clientErrors.push(`แถวที่ ${rowNum}: รหัสสาขา "${row.branchCode}" ไม่ถูกต้อง (สาขาที่มี: ${branchCodesInDb.join(', ')})`);
            }
          }

          if (!row.wsDate) {
            clientErrors.push(`แถวที่ ${rowNum}: ไม่มีวันที่ wsDate`);
          } else {
            let dateVal = row.wsDate;
            if (typeof dateVal === 'number') {
              const excelEpoch = new Date(Date.UTC(1899, 11, 30));
              dateVal = new Date(excelEpoch.getTime() + dateVal * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
              row.wsDate = dateVal;
            }
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) {
              clientErrors.push(`แถวที่ ${rowNum}: วันที่ wsDate "${row.wsDate}" รูปแบบไม่ถูกต้อง`);
            }
          }
        });

        setImportVehicles(parsedRows);
        setImportErrors(clientErrors);
        setIsImportOpen(true);
      } catch (err) {
        console.error(err);
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (importErrors.length > 0) {
      toast.warning('กรุณาแก้ไขข้อผิดพลาดในไฟล์ Excel ก่อนทำการนำเข้า');
      return;
    }

    setImportLoading(true);
    try {
      if (isDbConnected) {
        const res = await fetch('/api/vehicles/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicles: importVehicles }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to import vehicles');
        }

        const data = await res.json();
        toast.success(`นำเข้าเรียบร้อยแล้ว: ${data.message}`);
        
        const refreshRes = await fetch('/api/vehicles');
        if (refreshRes.ok) {
          const updatedList = await refreshRes.json();
          setVehicles(updatedList);
        }
      } else {
        const mockImported = importVehicles.map((v, i) => ({
          vin: String(v.vin).toUpperCase(),
          modelCode: v.modelCode,
          modelName: modelMap[v.modelCode] || v.modelCode,
          colorName: v.colorName,
          exteriorColor: v.exteriorColor,
          interiorColor: v.interiorColor,
          productionYear: parseInt(v.productionYear) || 2026,
          wsDate: new Date(v.wsDate).toISOString(),
          arrivedAt: new Date().toISOString(),
          currentStatus: 'IN_STOCK',
          branch: { name: branches.find(b => b.code.toUpperCase() === String(v.branchCode).toUpperCase())?.name || 'มีนบุรี' },
          pdiJobs: [{ id: `mock-import-${Date.now()}-${i}`, pdiType: 'INCOMING', status: 'PENDING' }],
        }));
        setVehicles([...mockImported, ...vehicles]);
        toast.success(`[Mock Mode] จำลองการนำเข้ารถยนต์สำเร็จ ${mockImported.length} คัน`);
      }
      window.dispatchEvent(new Event('pdi-job-updated'));
      setIsImportOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const modelMap: Record<string, string> = {
    AION_V: 'AION V',
    AION_V5: 'AION V 5',
    AION_UT: 'AION UT',
    AION_YP: 'AION Y Plus',
    AION_YP5: 'AION Y Plus 5',
    AION_ES: 'AION ES',
    HYPTEC_HT: 'HYPTEC HT',
    HYPTEC_SSR: 'HYPTEC SSR',
    GAC_M8: 'GAC M8',
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vin || !colorName || !wsDate) {
      toast.warning('กรุณากรอกข้อมูลสำคัญ: เลขตัวถัง (VIN), สีหลัก, วันที่ Wholesale');
      return;
    }

    setLoading(true);
    const payload = {
      vin,
      modelCode,
      modelName: modelMap[modelCode],
      colorName,
      exteriorColor,
      interiorColor,
      productionYear: parseInt(productionYear),
      wsDate: new Date(wsDate).toISOString(),
      branchId,
      warehouse,
      floorplan,
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to register vehicle');
        }

        const newVeh = await res.json();
        setVehicles([newVeh, ...vehicles]);
      } else {
        // Local state simulation
        const mockNewVeh = {
          ...payload,
          arrivedAt: new Date().toISOString(),
          currentStatus: 'IN_STOCK',
          branch: { name: branches.find(b => b.id === branchId)?.name || 'มีนบุรี' },
          pdiJobs: [{ id: `mock-${Date.now()}`, pdiType: 'INCOMING', status: 'PENDING' }],
        };
        setVehicles([mockNewVeh, ...vehicles]);
      }

      window.dispatchEvent(new Event('pdi-job-updated'));
      toast.success('ลงทะเบียนรถสำเร็จ', { description: 'นำรถเข้า Stock และสร้างงาน Incoming PDI อัตโนมัติ' });
      setIsDialogOpen(false);
      // Reset form
      setVin('');
      setColorName('');
      setExteriorColor('');
      setInteriorColor('');
      setWarehouse('');
      setFloorplan('');
      setWsDate('');
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const eligibleVehicles = vehicles.filter(
    (veh) => !veh.pdiJobs?.some((job: any) => job.pdiType === 'INCOMING')
  );

  const handleStartIncoming = async () => {
    if (selectedVins.length === 0) return;
    setActionLoading(true);
    try {
      if (isDbConnected) {
        const res = await fetch('/api/vehicles/start-incoming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vins: selectedVins }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to start incoming PDI');
        }

        const data = await res.json();
        toast.success(`สำเร็จ: ${data.message}`);

        // Refresh vehicle list
        const refreshRes = await fetch('/api/vehicles');
        if (refreshRes.ok) {
          const updatedList = await refreshRes.json();
          setVehicles(updatedList);
        }
      } else {
        // Mock mode simulation
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const updated = vehicles.map((veh) => {
          if (selectedVins.includes(veh.vin)) {
            const nowStr = new Date().toISOString();
            const deadlineStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            return {
              ...veh,
              arrivedAt: nowStr,
              incomingDeadline: deadlineStr,
              pdiJobs: [
                {
                  id: `mock-job-${Date.now()}-${veh.vin}`,
                  jobNumber: `JO-INC-${todayStr}-${Math.floor(100000 + Math.random() * 900000)}`,
                  pdiType: 'INCOMING',
                  status: 'PENDING',
                  scheduledDate: deadlineStr,
                },
                ...(veh.pdiJobs || [])
              ],
            };
          }
          return veh;
        });
        setVehicles(updated);
        toast.success(`[Mock Mode] เริ่มส่งตรวจ Incoming สำเร็จจำนวน ${selectedVins.length} คัน`);
      }
      setSelectedVins([]);
      window.dispatchEvent(new Event('pdi-job-updated'));
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">จัดการสต็อกรถยนต์ (Vehicle Stock)</h2>
          <p className="text-xs text-slate-500 mt-1">ทะเบียนรถในระบบ ตรวจสอบประวัติการรับรถและงาน PDI ครบวงจร</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Template button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>เทมเพลต (Template)</span>
          </Button>

          {/* Export Excel button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel (Export)</span>
          </Button>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          {/* Import Excel button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <Download className="w-4 h-4 text-brand-teal" />
            <span>นำเข้า Excel (Import)</span>
          </Button>

          {/* Start Incoming PDI button */}
          {selectedVins.length > 0 && (
            <Button
              onClick={handleStartIncoming}
              disabled={actionLoading}
              className="gap-1.5 text-xs font-semibold bg-brand-teal hover:bg-brand-teal/90 text-white"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เริ่มตรวจ Incoming ({selectedVins.length} คัน)</span>
            </Button>
          )}

          {/* Dialog register trigger - hidden */}
          {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 text-xs font-semibold">
                <Plus className="w-4 h-4 text-slate-950" />
                <span>ลงทะเบียนรับรถใหม่ (Receive Vehicle)</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <form onSubmit={handleRegister}>
                <DialogHeader>
                  <DialogTitle>ลงทะเบียนรับรถยนต์เข้าคลังสินค้า</DialogTitle>
                  <DialogDescription>
                    กรอกข้อมูลรถยนต์จากเรือเพื่อทำการจัดสรรเข้าโกดังเก็บและระบบจะสร้างใบสั่งงาน PDI แรกเริ่มโดยอัตโนมัติ
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-slate-500">เลขตัวถัง (VIN) *</Label>
                    <Input
                      required
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      placeholder="เช่น LNAT4AB34T5G05011"
                      className="font-mono text-xs uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">รุ่นโมเดลรถ (Model) *</Label>
                    <Select value={modelCode} onChange={(e: any) => setModelCode(e.target.value)}>
                      {Object.entries(modelMap).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">สีรถภายนอกหลัก (Color Code/Name) *</Label>
                    <Input
                      required
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="เช่น Space Gray"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">ลักษณะสีภายนอก (Exterior Color)</Label>
                    <Input
                      value={exteriorColor}
                      onChange={(e) => setExteriorColor(e.target.value)}
                      placeholder="เช่น Gray Metallic / Matte Black"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">โทนสีตกแต่งภายใน (Interior Color)</Label>
                    <Input
                      value={interiorColor}
                      onChange={(e) => setInteriorColor(e.target.value)}
                      placeholder="เช่น Coal Black / Amber Brown"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">ปีที่ผลิตรถ (Production Year)</Label>
                    <Select value={productionYear} onChange={(e: any) => setProductionYear(e.target.value)}>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">วันที่ขายส่งดีลเลอร์ (WSDate) *</Label>
                    <Input
                      required
                      type="date"
                      value={wsDate}
                      onChange={(e) => setWsDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">โซนจอดในคลัง (Warehouse/Zone)</Label>
                    <Input
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      placeholder="เช่น โกดังท่าเรือแหลมฉบัง A"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">ตำแหน่งจอดรถ (Floorplan/Lot)</Label>
                    <Input
                      value={floorplan}
                      onChange={(e) => setFloorplan(e.target.value)}
                      placeholder="เช่น แถว A ล็อต 3"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-slate-500">สาขาที่จัดสรร (Branch)</Label>
                    <Select value={branchId} onChange={(e: any) => setBranchId(e.target.value)}>
                      {isDbConnected && branches.length > 0 ? (
                        branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))
                      ) : (
                        <option value="mock-branch">สาขามีนบุรี (MBR)</option>
                      )}
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" size="sm">
                      ยกเลิก
                    </Button>
                  </DialogClose>
                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันลงทะเบียนรับรถ'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog> */}
      </div>
    </div>

      {/* Search and Tab Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
        {/* Tab Filters */}
        <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-lg">
          {(['ALL', 'INCOMING', 'LONG_TERM', 'PRE_DELIVERY'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-brand-teal text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' && 'ทั้งหมด'}
              {tab === 'INCOMING' && 'Incoming'}
              {tab === 'LONG_TERM' && 'Long-term'}
              {tab === 'PRE_DELIVERY' && 'Pre-delivery'}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="flex items-center gap-2 max-w-xs w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="ค้นหาเลขตัวถัง, รุ่นรถ, สาขา, โกดัง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-[11px] border-slate-200 bg-white focus-visible:ring-brand-teal focus-visible:border-brand-teal"
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-[10px] h-8 px-2 text-slate-400 hover:text-slate-600"
            >
              ล้าง
            </Button>
          )}
        </div>
      </div>

      {/* Stock list table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                <TableRow>
                  <TableHead className="w-16 text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">ส่งตรวจ<br/><span className="text-[10px] text-slate-400 font-normal">(Select)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">เลขตัวถัง<br/><span className="text-[10px] text-slate-400 font-normal">(VIN)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">รุ่นรถ<br/><span className="text-[10px] text-slate-400 font-normal">(Model)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">สีรถ (นอก/ใน)<br/><span className="text-[10px] text-slate-400 font-normal">(Colors)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">ปีผลิต<br/><span className="text-[10px] text-slate-400 font-normal">(Year)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">สาขา<br/><span className="text-[10px] text-slate-400 font-normal">(Branch)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">โกดัง/ล็อคจอด<br/><span className="text-[10px] text-slate-400 font-normal">(Location)</span></TableHead>
                  <TableHead className="whitespace-nowrap py-3.5 font-semibold text-slate-700">วันที่เข้าคลัง<br/><span className="text-[10px] text-slate-400 font-normal">(Arrived At)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">สถานะคลัง<br/><span className="text-[10px] text-slate-400 font-normal">(Stock Status)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">สถานะ PDI<br/><span className="text-[10px] text-slate-400 font-normal">(PDI Status)</span></TableHead>
                  <TableHead className="text-center whitespace-nowrap py-3.5 font-semibold text-slate-700">ดูรายละเอียด<br/><span className="text-[10px] text-slate-400 font-normal">(View Details)</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                      {searchQuery.trim() !== '' || activeTab !== 'ALL'
                        ? 'ไม่พบข้อมูลรถยนต์ที่ระบุ'
                        : 'ไม่มีข้อมูลรถยนต์ในสต็อก'}
                    </TableCell>
                  </TableRow>
                ) : (
                   filteredVehicles.map((veh) => {
                    // Find current PDI status
                    const latestJob = veh.pdiJobs?.[0];
                    const hasIncomingJob = veh.pdiJobs?.some((job: any) => job.pdiType === 'INCOMING');
                    const isRepairing = latestJob && (latestJob.status === 'DEFECT_FOUND' || latestJob.status === 'REJECTED');

                    return (
                      <TableRow key={veh.vin} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="w-16 text-center py-4">
                          {!hasIncomingJob ? (
                            <input
                              type="checkbox"
                              checked={selectedVins.includes(veh.vin)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVins([...selectedVins, veh.vin]);
                                } else {
                                  setSelectedVins(selectedVins.filter((id) => id !== veh.vin));
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                            />
                          ) : (
                            <div className="w-4 h-4 mx-auto flex items-center justify-center">
                              {/* Empty space */}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-800 font-medium py-4 select-all">{veh.vin}</TableCell>
                        <TableCell className="text-xs font-semibold py-4">{veh.modelName}</TableCell>
                        <TableCell className="text-xs py-4">
                          <div className="text-slate-700">{veh.exteriorColor || veh.colorName || '-'}</div>
                          <div className="text-slate-500 text-[10px]">ใน: {veh.interiorColor || '-'}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono py-4">{veh.productionYear || '-'}</TableCell>
                        <TableCell className="text-xs py-4 font-semibold text-slate-700">{veh.branch?.name || '-'}</TableCell>
                        <TableCell className="text-xs py-4">
                          <div className="text-slate-700">{veh.warehouse || '-'}</div>
                          <div className="text-slate-500 text-[10px]">{veh.floorplan || '-'}</div>
                        </TableCell>
                        <TableCell className="text-xs py-4">
                          {new Date(veh.arrivedAt).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Badge
                            variant={
                              isRepairing
                                ? 'danger'
                                : veh.currentStatus === 'DELIVERED'
                                ? 'success'
                                : veh.currentStatus === 'IN_STOCK'
                                ? 'info'
                                : 'default'
                            }
                          >
                            {isRepairing && 'พบจุดชำรุด'}
                            {!isRepairing && veh.currentStatus === 'IN_STOCK' && 'ใน Stock'}
                            {!isRepairing && veh.currentStatus === 'DELIVERED' && 'ส่งมอบแล้ว'}
                            {!isRepairing && veh.currentStatus !== 'IN_STOCK' && veh.currentStatus !== 'DELIVERED' && veh.currentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          {latestJob ? (
                            <span className="text-[10px] font-semibold">
                              {latestJob.pdiType}: {' '}
                              {isRepairing ? (
                                <span className="text-amber-600">กำลังปรับสภาพซ่อม</span>
                              ) : (
                                <>
                                  {latestJob.status === 'PENDING' && <span className="text-slate-500">รอตรวจ</span>}
                                  {latestJob.status === 'IN_PROGRESS' && <span className="text-brand-teal">กำลังตรวจ</span>}
                                  {latestJob.status === 'PENDING_APPROVAL' && <span className="text-warning">รอ QC</span>}
                                  {latestJob.status === 'APPROVED' && <span className="text-success">อนุมัติแล้ว</span>}
                                  {latestJob.status === 'REJECTED' && <span className="text-danger">ถูก Reject</span>}
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">ไม่มีงานตรวจ</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Link href={`/vehicles/${veh.vin}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )/* empty */}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-teal" />
              <span>พรีวิวและตรวจสอบข้อมูลนำเข้า Excel ({importVehicles.length} คัน)</span>
            </DialogTitle>
            <DialogDescription>
              ตรวจสอบความถูกต้องก่อนกดนำเข้าเข้าสู่ระบบ เมื่อสำเร็จระบบจะสร้าง Incoming PDI Job ให้อัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          {importErrors.length > 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg space-y-2">
              <h4 className="text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>พบข้อผิดพลาดในไฟล์ Excel ({importErrors.length} รายการ) กรุณาแก้ไขแล้วอัปโหลดใหม่:</span>
              </h4>
              <ul className="text-[11px] list-disc pl-4 space-y-1 max-h-48 overflow-y-auto font-medium">
                {importErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              <span className="text-xs font-semibold">ข้อมูลทั้งหมดผ่านเกณฑ์การตรวจสอบเบื้องต้นแล้ว! พร้อมนำเข้าข้อมูลรถจำนวน {importVehicles.length} คัน</span>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">เลขตัวถัง (VIN)</TableHead>
                    <TableHead className="text-xs">รุ่นโมเดล</TableHead>
                    <TableHead className="text-xs">สีภายนอก</TableHead>
                    <TableHead className="text-xs">สีภายใน</TableHead>
                    <TableHead className="text-xs">ปีผลิต</TableHead>
                    <TableHead className="text-xs">วันที่ WSDate</TableHead>
                    <TableHead className="text-xs">สาขา</TableHead>
                    <TableHead className="text-xs">โกดัง/โซน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importVehicles.map((v, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800">{v.vin}</TableCell>
                      <TableCell className="text-xs">{modelMap[v.modelCode] || v.modelCode}</TableCell>
                      <TableCell className="text-xs">{v.colorName} {v.exteriorColor ? `(${v.exteriorColor})` : ''}</TableCell>
                      <TableCell className="text-xs">{v.interiorColor || '-'}</TableCell>
                      <TableCell className="text-xs font-mono">{v.productionYear || '-'}</TableCell>
                      <TableCell className="text-xs font-mono">{v.wsDate}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">{v.branchCode}</TableCell>
                      <TableCell className="text-xs">{v.warehouse || '-'} / {v.floorplan || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm">
                ยกเลิก
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleConfirmImport} 
              disabled={importErrors.length > 0 || importLoading}
              size="sm"
            >
              {importLoading ? 'กำลังนำเข้าข้อมูล...' : 'ยืนยันนำเข้าข้อมูล'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
