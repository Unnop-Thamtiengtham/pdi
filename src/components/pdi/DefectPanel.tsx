'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertTriangle, Camera, Check } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

interface Defect {
  id?: string;
  checklistItemCode?: string | null;
  description: string;
  cause?: string | null;
  solution?: string | null;
  severity: string; // "NORMAL" | "CRITICAL"
  status: string; // "OPEN" | "IN_REPAIR" | "RESOLVED" | "CLOSED"
  photoUrl?: string | null;
}

interface DefectPanelProps {
  defects: Defect[];
  onChange: (defects: Defect[]) => void;
  checklistItemCodes?: string[];
  readOnly?: boolean;
}

export default function DefectPanel({
  defects,
  onChange,
  checklistItemCodes = [],
  readOnly = false,
}: DefectPanelProps) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('NORMAL');
  const [itemCode, setItemCode] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newDefect: Defect = {
      description,
      severity,
      checklistItemCode: itemCode || null,
      status: 'OPEN',
      photoUrl,
    };

    onChange([...defects, newDefect]);
    setDescription('');
    setSeverity('NORMAL');
    setItemCode('');
    setPhotoUrl(null);
  };

  const handleRemoveDefect = (index: number) => {
    const updated = defects.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleStatusChange = (index: number, newStatus: string) => {
    const updated = defects.map((d, i) => {
      if (i === index) {
        return { ...d, status: newStatus };
      }
      return d;
    });
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span>บันทึกจุดบกพร่อง / Defect Panel ({defects.length})</span>
        </CardTitle>
        <p className="text-xs text-slate-500">กรณีมีรายการไม่ผ่านเกณฑ์ (FAIL) บันทึกและระบุรายละเอียดเพื่อแจ้งแก้ไข</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Defect Form */}
        {!readOnly && (
          <form onSubmit={handleAddDefect} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-semibold text-brand-teal uppercase tracking-wider">เพิ่มจุดบกพร่องใหม่</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs text-slate-500">รายละเอียดปัญหา *</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุจุดบกพร่องและตำแหน่ง เช่น รอยรอยขีดข่วนกันชนหน้าซ้าย"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">ระดับความรุนแรง</Label>
                <Select value={severity} onChange={(e: any) => setSeverity(e.target.value)}>
                  <option value="NORMAL">ปกติ (NORMAL)</option>
                  <option value="CRITICAL">รุนแรง (CRITICAL - ต้องซ่อมด่วน)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">อ้างอิงรหัสรายการตรวจ (เลือกจาก Checklist)</Label>
                <Select value={itemCode} onChange={(e: any) => setItemCode(e.target.value)}>
                  <option value="">-- ไม่อ้างอิง --</option>
                  {checklistItemCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">แนบรูปภาพปัญหา</Label>
                <PhotoUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  placeholder="คลิกถ่ายรูปหรืออัปโหลด"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> เพิ่มรายการ Defect
              </Button>
            </div>
          </form>
        )}

        {/* Defects List */}
        {defects.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
            ไม่มีรายการจุดบกพร่องที่บันทึก
          </div>
        ) : (
          <div className="space-y-3">
            {defects.map((defect, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border bg-slate-50 ${
                  defect.severity === 'CRITICAL' ? 'border-error/20 bg-error/5' : 'border-slate-200'
                }`}
              >
                <div className="flex gap-4 items-start flex-1">
                  {defect.photoUrl ? (
                    <img
                      src={defect.photoUrl}
                      alt="Defect"
                      className="w-16 h-16 rounded object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">#{index + 1} {defect.description}</span>
                      {defect.checklistItemCode && (
                        <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-100">
                          อ้างอิง: {defect.checklistItemCode}
                        </Badge>
                      )}
                      {defect.severity === 'CRITICAL' ? (
                        <Badge variant="danger">CRITICAL</Badge>
                      ) : (
                        <Badge variant="default">NORMAL</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      สถานะ: {' '}
                      {defect.status === 'OPEN' && <span className="text-error font-medium">รอแก้ไข (OPEN)</span>}
                      {defect.status === 'IN_REPAIR' && <span className="text-warning font-medium">กำลังซ่อม (IN REPAIR)</span>}
                      {defect.status === 'RESOLVED' && <span className="text-success font-medium">แก้ไขแล้ว (RESOLVED)</span>}
                      {defect.status === 'CLOSED' && <span className="text-slate-500 font-medium">ปิดงาน (CLOSED)</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
                  {!readOnly ? (
                    <>
                      <Select
                        value={defect.status}
                        onChange={(e: any) => handleStatusChange(index, e.target.value)}
                        className="h-8 text-xs py-1"
                      >
                        <option value="OPEN">รอแก้ไข (OPEN)</option>
                        <option value="IN_REPAIR">กำลังซ่อม (IN REPAIR)</option>
                        <option value="RESOLVED">แก้ไขแล้ว (RESOLVED)</option>
                        <option value="CLOSED">ปิดงาน (CLOSED)</option>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDefect(index)}
                        className="text-slate-500 hover:text-error h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    // Show readonly status badge
                    <Badge
                      variant={
                        defect.status === 'OPEN'
                          ? 'danger'
                          : defect.status === 'IN_REPAIR'
                          ? 'warning'
                          : defect.status === 'RESOLVED'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {defect.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
