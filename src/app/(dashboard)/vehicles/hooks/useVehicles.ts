'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Model code to name mapping
export const modelMap: Record<string, string> = {
  AION_V: 'AION V',
  AION_V5: 'AION V 5',
  AION_UT: 'AION UT',
  AION_YP: 'AION Y Plus',
  AION_YP5: 'AION Y Plus 5',
  AION_ES: 'AION ES',
  HYPTEC_HT: 'HYPTEC HT',
  HYPTEC_HT8: 'HYPTEC HT 8',
  HYPTEC_SSR: 'HYPTEC SSR',
  GAC_M8: 'GAC M8',
};

export const pdiStatusMap: Record<string, string> = {
  PENDING: 'รอตรวจ',
  IN_PROGRESS: 'กำลังตรวจ',
  PENDING_APPROVAL: 'รอ QC',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ถูก Reject',
};

interface UseVehiclesOptions {
  initialVehicles: any[];
  branches: any[];
  isDbConnected: boolean;
}

export function useVehicles({ initialVehicles, branches, isDbConnected }: UseVehiclesOptions) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'INSPECTOR';
  const canSendIncoming = userRole === 'SUPER_ADMIN' || userRole === 'SUPERVISOR' || userRole === 'MASTER';

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
            motorBatteryNumber: 'TZ220XS-BAT-V-011',
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
            motorBatteryNumber: 'TZ230XS-BAT-HT-022',
          },
        ]
  );

  // Form states for manual register
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
  const [selectedLotFilter, setSelectedLotFilter] = useState<string>('ALL');

  // Get list of unique lot numbers for the filter dropdown
  const uniqueLots = useMemo(() => {
    const lots = new Set<string>();
    vehicles.forEach((v) => {
      if (v.lotNumber) {
        lots.add(v.lotNumber);
      }
    });
    return Array.from(lots).sort();
  }, [vehicles]);

  // Filtered dataset based on activeTab, searchQuery, and selectedLotFilter
  const filteredVehicles = vehicles.filter((veh) => {
    const latestJob = veh.pdiJobs?.[0];
    if (activeTab !== 'ALL') {
      if (!latestJob || latestJob.pdiType !== activeTab) {
        return false;
      }
    }

    if (selectedLotFilter !== 'ALL') {
      if (veh.lotNumber !== selectedLotFilter) {
        return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const vinMatch = veh.vin.toLowerCase().includes(q);
      const modelMatch = (veh.modelName || '').toLowerCase().includes(q);
      const branchMatch = (veh.branch?.name || '').toLowerCase().includes(q);
      const warehouseMatch = (veh.warehouse || '').toLowerCase().includes(q);
      const floorplanMatch = (veh.floorplan || '').toLowerCase().includes(q);
      const lotMatch = (veh.lotNumber || '').toLowerCase().includes(q);
      
      return vinMatch || modelMatch || branchMatch || warehouseMatch || floorplanMatch || lotMatch;
    }

    return true;
  });

  // Excel export
  const handleExportExcel = async () => {
    const { default: XLSX } = await import('xlsx-js-style');
    const { formatWorksheet } = await import('../utils/formatWorksheet');
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
        'เลขล็อต/เลขล็อค (Lot Number)': v.lotNumber || '',
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

  // Download import template
  const handleDownloadTemplate = async () => {
    const { default: XLSX } = await import('xlsx-js-style');
    const { formatWorksheet } = await import('../utils/formatWorksheet');
    const templateData = [
      {
        'เลขตัวถัง (VIN)': 'LNAT4AB34T5G00001',
        'เลขมอเตอร์แบตเตอรี่ (Motor Battery No.)': 'TZ220XS-BAT2026060000001',
        'รหัสรุ่น': 'AION_V',
        'สีรถภายนอกหลัก': 'Space Gray',
        'ลักษณะสีภายนอก': 'Gray Metallic',
        'โทนตกแต่งภายใน': 'Coal Black',
        'ปีที่ผลิตรถ': 2026,
        'วันที่ขายส่งดีลเลอร์ (WSDate)': '2026-06-23',
        'คลังสินค้าโกดัง': 'คลังท่าเรือแหลมฉบัง',
        'โซน/ตำแหน่งจอด': 'Zone A-3',
        'เลขล็อต/เลขล็อค': 'LOT-2026-01',
        'รหัสสาขา (Branch Code)': 'MBR'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    formatWorksheet(XLSX, ws, true, 'TH Sarabun New');

    const modelCodes = [
      { code: 'AION_V', name: 'AION V' },
      { code: 'AION_V5', name: 'AION V 5' },
      { code: 'AION_UT', name: 'AION UT' },
      { code: 'AION_YP', name: 'AION Y Plus' },
      { code: 'AION_YP5', name: 'AION Y Plus 5' },
      { code: 'AION_ES', name: 'AION ES' },
      { code: 'HYPTEC_HT', name: 'HYPTEC HT' },
      { code: 'HYPTEC_HT8', name: 'HYPTEC HT 8' },
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

  // Handle file upload for Excel import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const { default: XLSX } = await import('xlsx-js-style');
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
          vin: row.vin || row['เลขตัวถัง (VIN)'] || row['เลขตัวถัง'] || row['VIN'] || '',
          modelCode: row.modelCode || row['รหัสรุ่น'] || row['Model Code'] || '',
          colorName: row.colorName || row['สีรถภายนอกหลัก'] || row['สีหลัก'] || row['Color'] || '',
          exteriorColor: row.exteriorColor || row['ลักษณะสีภายนอก'] || row['สีภายนอก'] || row['Exterior Color'] || '',
          interiorColor: row.interiorColor || row['โทนตกแต่งภายใน'] || row['สีภายใน'] || row['Interior Color'] || '',
          productionYear: row.productionYear || row['ปีที่ผลิตรถ'] || row['ปีผลิต'] || row['Year'] || '',
          wsDate: row.wsDate || row['วันที่ขายส่งดีลเลอร์ (WSDate)'] || row['วันที่ขายส่ง'] || row['WSDate'] || '',
          warehouse: row.warehouse || row['คลังสินค้าโกดัง'] || row['โกดัง'] || row['Warehouse'] || '',
          floorplan: row.floorplan || row['โซน/ตำแหน่งจอด'] || row['ตำแหน่งจอด'] || row['Floorplan'] || '',
          lotNumber: row.lotNumber || row['เลขล็อต/เลขล็อค'] || row['ล็อต'] || row['เลขล็อต'] || row['Lot'] || row['Lot Number'] || row['ล็อค'] || row['เลขล็อค'] || '',
          branchCode: row.branchCode || row['รหัสสาขา (Branch Code)'] || row['รหัสสาขา'] || row['Branch Code'] || '',
          motorBatteryNumber: row.motorBatteryNumber || row['เลขมอเตอร์แบตเตอรี่ (Motor Battery No.)'] || row['เลขมอเตอร์แบตเตอรี่'] || row['Motor Battery Number'] || '',
        }));

        const clientErrors: string[] = [];
        const validModelCodes = ['AION_V', 'AION_V5', 'AION_UT', 'AION_YP', 'AION_YP5', 'AION_ES', 'HYPTEC_HT', 'HYPTEC_HT8', 'HYPTEC_SSR', 'GAC_M8'];
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
            clientErrors.push(`แถวที่ ${rowNum}: รหัสรุ่น "${row.modelCode}" ไม่ถูกต้อง (เลือกได้เฉพาะ: AION_V, AION_V5, AION_UT, AION_YP, AION_YP5, AION_ES, HYPTEC_HT, HYPTEC_HT8, HYPTEC_SSR, GAC_M8)`);
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

  // Confirm import
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
        const mockImported = importVehicles.map((v, i) => {
          const nowStr = new Date().toISOString();
          const deadlineStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          return {
            vin: String(v.vin).toUpperCase(),
            modelCode: v.modelCode,
            modelName: modelMap[v.modelCode] || v.modelCode,
            colorName: v.colorName,
            exteriorColor: v.exteriorColor,
            interiorColor: v.interiorColor,
            productionYear: parseInt(v.productionYear) || 2026,
            wsDate: new Date(v.wsDate).toISOString(),
            motorBatteryNumber: v.motorBatteryNumber,
            arrivedAt: nowStr,
            incomingDeadline: deadlineStr,
            lotNumber: v.lotNumber || null,
            currentStatus: 'IN_STOCK',
            branch: { name: branches.find(b => b.code.toUpperCase() === String(v.branchCode).toUpperCase())?.name || 'มีนบุรี' },
            pdiJobs: [{ id: `mock-import-${Date.now()}-${i}`, pdiType: 'INCOMING', status: 'PENDING', scheduledDate: deadlineStr }],
          };
        });
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

  // Manual register vehicle
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

  // Start incoming PDI
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

        const refreshRes = await fetch('/api/vehicles');
        if (refreshRes.ok) {
          const updatedList = await refreshRes.json();
          setVehicles(updatedList);
        }
      } else {
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

  return {
    // Data
    vehicles,
    filteredVehicles,
    uniqueLots,
    // Role flags
    canSendIncoming,
    // Filter & Search
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedLotFilter,
    setSelectedLotFilter,
    // Register form
    isDialogOpen,
    setIsDialogOpen,
    vin, setVin,
    modelCode, setModelCode,
    colorName, setColorName,
    exteriorColor, setExteriorColor,
    interiorColor, setInteriorColor,
    productionYear, setProductionYear,
    wsDate, setWsDate,
    branchId, setBranchId,
    warehouse, setWarehouse,
    floorplan, setFloorplan,
    loading,
    handleRegister,
    // Import/Export
    isImportOpen,
    setIsImportOpen,
    importVehicles,
    importErrors,
    importLoading,
    fileInputRef,
    handleExportExcel,
    handleDownloadTemplate,
    handleFileChange,
    handleConfirmImport,
    // Start Incoming
    selectedVins,
    setSelectedVins,
    actionLoading,
    handleStartIncoming,
  };
}
