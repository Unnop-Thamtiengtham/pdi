'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ChevronRight, Download, FileSpreadsheet, Search } from 'lucide-react';
import Link from 'next/link';
import { useVehicles } from './hooks/useVehicles';
import ImportPreviewDialog from './components/ImportPreviewDialog';

interface VehiclesClientProps {
  initialVehicles: any[];
  branches: any[];
  isDbConnected: boolean;
}

export default function VehiclesClient({ initialVehicles, branches, isDbConnected }: VehiclesClientProps) {
  const {
    filteredVehicles,
    uniqueLots,
    // Filter & Search
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedLotFilter,
    setSelectedLotFilter,
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
  } = useVehicles({ initialVehicles, branches, isDbConnected });

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

        {/* Filter Controls (Lot Dropdown + Search Box) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md w-full sm:justify-end">
          {/* Lot Filter Dropdown */}
          <div className="w-full sm:w-40 shrink-0">
            <Select
              value={selectedLotFilter}
              onChange={(e: any) => setSelectedLotFilter(e.target.value)}
              className="h-8 text-[11px] border-slate-200 bg-white"
            >
              <option value="ALL">ล็อตทั้งหมด (All Lots)</option>
              {uniqueLots.map((lot) => (
                <option key={lot} value={lot}>
                  {lot}
                </option>
              ))}
            </Select>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="ค้นหาเลขตัวถัง, รุ่นรถ, ล็อต..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-[11px] border-slate-200 bg-white focus-visible:ring-brand-teal focus-visible:border-brand-teal w-full"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-[10px] h-8 px-2 text-slate-400 hover:text-slate-600 shrink-0"
              >
                ล้าง
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stock list table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                <TableRow>
                  <TableHead className="pl-6 whitespace-nowrap py-3.5 font-semibold text-slate-700">ล็อตการรับเข้า<br/><span className="text-[10px] text-slate-400 font-normal">(Lot Number)</span></TableHead>
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
                    const latestJob = veh.pdiJobs?.[0];
                    const isRepairing = latestJob && (latestJob.status === 'DEFECT_FOUND' || latestJob.status === 'REJECTED');

                    return (
                      <TableRow key={veh.vin} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6 py-4 whitespace-nowrap">
                          {veh.lotNumber ? (
                            <span className="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {veh.lotNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-800 font-medium py-4 select-all">
                          <div>{veh.vin}</div>
                          {veh.motorBatteryNumber && (
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5 font-normal leading-normal">
                              <div>มอเตอร์แบตเตอรี่:</div>
                              <div className="font-mono text-slate-700 text-[9.5px] mt-0.5">{veh.motorBatteryNumber}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold py-4 whitespace-nowrap">{veh.modelName}</TableCell>
                        <TableCell className="text-xs py-4">
                          <div className="text-slate-700">{veh.exteriorColor || veh.colorName || '-'}</div>
                          <div className="text-slate-500 text-[10px]">ใน: {veh.interiorColor || '-'}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono py-4">{veh.productionYear || '-'}</TableCell>
                        <TableCell className="text-xs py-4 font-semibold text-slate-700">{veh.branch?.name || '-'}</TableCell>
                        <TableCell className="text-xs py-4">
                          <div className="text-slate-700 font-semibold">{veh.warehouse || '-'}</div>
                          <div className="text-slate-500 text-[10px]">ตำแหน่งจอด: {veh.floorplan || '-'}</div>
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
                              {latestJob.pdiType}:
                              <br />
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
      <ImportPreviewDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        importVehicles={importVehicles}
        importErrors={importErrors}
        importLoading={importLoading}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
