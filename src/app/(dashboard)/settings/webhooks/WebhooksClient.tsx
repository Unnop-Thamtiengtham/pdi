'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit, Radio, Activity, CheckCircle2, XCircle, RefreshCw, Eye, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  status: number;
  requestBody: string;
  responseBody: string | null;
  createdAt: string;
}

interface WebhooksClientProps {
  initialWebhooks: WebhookData[];
}

export default function WebhooksClient({ initialWebhooks }: WebhooksClientProps) {
  const [webhooks, setWebhooks] = useState<WebhookData[]>(initialWebhooks);
  const [loading, setLoading] = useState(false);

  // Form states for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Testing connection state
  const [testing, setTesting] = useState(false);

  // Log viewer states
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsWebhook, setLogsWebhook] = useState<WebhookData | null>(null);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeLogDetail, setActiveLogDetail] = useState<DeliveryLog | null>(null);

  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingWebhook, setDeletingWebhook] = useState<WebhookData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy state helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySecret = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('คัดลอกรหัส Token ลับแล้ว');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingWebhook(null);
    setName('');
    setUrl('');
    setSecret('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (w: WebhookData) => {
    setEditingWebhook(w);
    setName(w.name);
    setUrl(w.url);
    setSecret(w.secret || '');
    setIsActive(w.isActive);
    setIsFormOpen(true);
  };

  const handleOpenLogs = async (w: WebhookData) => {
    setLogsWebhook(w);
    setIsLogsOpen(true);
    setLoadingLogs(true);
    setLogs([]);
    setActiveLogDetail(null);
    try {
      const res = await fetch(`/api/webhooks/deliveries?webhookId=${w.id}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        toast.error('ไม่สามารถโหลดประวัติการส่งได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดประวัติการส่ง');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefreshLogs = async () => {
    if (!logsWebhook) return;
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/webhooks/deliveries?webhookId=${logsWebhook.id}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        toast.success('อัปเดตประวัติการยิงข้อมูลล่าสุดแล้ว');
      }
    } catch {
      toast.error('ไม่สามารถอัปเดตประวัติได้');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenDelete = (w: WebhookData) => {
    setDeletingWebhook(w);
    setIsDeleteOpen(true);
  };

  const handleTestConnection = async () => {
    if (!url) {
      toast.warning('กรุณากรอก URL ปลายทางก่อนทดสอบ');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, secret: secret || null }),
      });

      const result = await res.json();
      const cleanResponse = (result.response || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (result.success) {
        toast.success(`เชื่อมต่อสำเร็จ (Status Code: ${result.status})`, {
          description: 'ระบบเชื่อมต่อกับเซิร์ฟเวอร์ปลายทางเรียบร้อยแล้ว',
        });
      } else {
        toast.error(`เชื่อมต่อล้มเหลว (Status Code: ${result.status})`, {
          description: `ไม่สามารถเชื่อมต่อได้: ${cleanResponse || 'เซิร์ฟเวอร์ปฏิเสธการเชื่อมต่อ'}`,
        });
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อกับ URL ปลายทางได้');
    } finally {
      setTesting(false);
    }
  };

  const handleToggleActive = async (w: WebhookData) => {
    try {
      const payload = {
        id: w.id,
        name: w.name,
        url: w.url,
        secret: w.secret,
        isActive: !w.isActive,
      };

      const res = await fetch('/api/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setWebhooks(prev => prev.map(item => item.id === w.id ? updated : item));
        toast.success(`${w.name} ถูก ${!w.isActive ? 'เปิด' : 'ปิด'} การยิงข้อมูลแล้ว`);
      } else {
        toast.error('ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) {
      toast.error('กรุณากรอกชื่อและ URL ให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const method = editingWebhook ? 'PUT' : 'POST';
      const payload = {
        id: editingWebhook?.id,
        name: name.trim(),
        url: url.trim(),
        secret: secret.trim() || null,
        isActive,
      };

      const res = await fetch('/api/webhooks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      toast.success(editingWebhook ? `แก้ไข Webhook ${name} สำเร็จ!` : `สร้าง Webhook ${name} สำเร็จแล้ว!`);
      setIsFormOpen(false);

      // Refresh list
      const fetchList = await fetch('/api/webhooks');
      if (fetchList.ok) {
        const updatedList = await fetchList.json();
        setWebhooks(updatedList);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWebhook) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/webhooks?id=${deletingWebhook.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }

      toast.success(`ลบ Webhook ${deletingWebhook.name} สำเร็จแล้ว!`);
      setIsDeleteOpen(false);

      setWebhooks(prev => prev.filter(w => w.id !== deletingWebhook.id));
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      toast.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <span>จัดการการส่งข้อมูลภายนอก (Webhook Settings)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตั้งค่า URL ปลายทางที่ต้องการให้ยิงข้อมูลผลลัพธ์การตรวจเช็คสภาพรถยนต์ (PDI) กลับไปแจ้งทันทีแบบอัตโนมัติ
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-brand-teal text-[#080C14] hover:bg-[#22B4C4] font-semibold text-xs px-3.5 py-2 rounded-lg cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มการเชื่อมต่อ</span>
        </Button>
      </div>

      {/* Webhooks Config List */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-teal animate-pulse" />
            <span>รายการ Webhooks ทั้งหมด ({webhooks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                <TableRow>
                  <TableHead className="pl-6 py-3.5 text-xs font-semibold text-slate-700 text-left whitespace-nowrap">ชื่อระบบเชื่อมต่อ</TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold text-slate-700 text-left whitespace-nowrap">URL ปลายทาง (Webhook Endpoint)</TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold text-slate-700 text-left whitespace-nowrap">Token รับรองสิทธิ์</TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold text-slate-700 text-center whitespace-nowrap">สถานะใช้งาน</TableHead>
                  <TableHead className="pr-6 py-3.5 text-xs font-semibold text-slate-700 text-center whitespace-nowrap">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                      ไม่มีการเชื่อมต่อภายนอกที่กำหนดไว้ (หากไม่มีจะยิงข้อมูลผ่านตัวแปรระบบ PDI_WEBHOOK_URL)
                    </TableCell>
                  </TableRow>
                ) : (
                  webhooks.map((w) => (
                    <TableRow key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{w.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {w.id}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-mono font-medium text-indigo-650 break-all bg-slate-50 border border-slate-100 rounded px-2 py-1 max-w-md inline-block truncate">
                          {w.url}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {w.secret ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500 font-mono">••••••••</span>
                            <button
                              type="button"
                              onClick={() => handleCopySecret(w.secret!, w.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Copy Secret Key"
                            >
                              {copiedId === w.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">ไม่มีการตั้งค่าคีย์</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(w)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                            w.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-450 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${w.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {w.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </button>
                      </TableCell>
                      <TableCell className="pr-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenLogs(w)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-8 px-2 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-xs">ประวัติยิง</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(w)}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 h-8 px-2 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="text-xs">แก้ไข</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(w)}
                            className="text-rose-600 hover:text-rose-950 hover:bg-rose-55 h-8 px-2 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-xs">ลบ</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Add/Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600" />
              <span>{editingWebhook ? 'แก้ไขการเชื่อมต่อ Webhook' : 'เพิ่มการเชื่อมต่อ Webhook ใหม่'}</span>
            </DialogTitle>
            <DialogDescription>
              ป้อนข้อมูล URL ปลายทางของทีมอื่นสำหรับรับข่าวสารการตรวจสอบ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="webhook-name" className="text-xs text-slate-600 font-semibold">
                ชื่อการเชื่อมต่อ (Webhook Name) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="webhook-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ระบบศูนย์ควบคุมใหญ่, ประกันภัยเจ้าหน้าที่"
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webhook-url" className="text-xs text-slate-600 font-semibold">
                URL ปลายทาง (Webhook Endpoint URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.partner.com/v1/webhook-receiver"
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webhook-secret" className="text-xs text-slate-600 font-semibold">
                คีย์รับรองความปลอดภัย (Secret Authorization Bearer Token)
              </Label>
              <Input
                id="webhook-secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="กรอก Token ลับเพื่อส่งผ่าน Header Authorization (ถ้ามี)"
                className="text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <Label htmlFor="webhook-active" className="text-xs text-slate-600 font-semibold cursor-pointer">
                เปิดให้เริ่มทำงานทันที (Active Status)
              </Label>
              <input
                id="webhook-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-teal accent-brand-teal cursor-pointer"
              />
            </div>

            <DialogFooter className="flex justify-between items-center w-full mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing || !url}
                className="cursor-pointer border-slate-350 hover:bg-indigo-50 text-indigo-650 flex items-center gap-1 disabled:opacity-50"
              >
                {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ (Ping)'}
              </Button>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" size="sm" className="cursor-pointer" disabled={loading}>
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  className="cursor-pointer"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกตั้งค่า'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs View Modal */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-slate-800">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>ประวัติการยิงข้อมูลสำหรับ: {logsWebhook?.name}</span>
              </div>
              <button
                type="button"
                onClick={handleRefreshLogs}
                disabled={loadingLogs}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 cursor-pointer disabled:opacity-50 flex items-center gap-1 text-[11px] font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>โหลดซ้ำ</span>
              </button>
            </DialogTitle>
            <DialogDescription>
              รายการข้อมูลจำลอง/ผลงานจริงที่ยิงไปยังปลายทาง ({logs.length} ครั้งล่าสุด)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-2 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Logs List Table */}
            <div className={`transition-all duration-300 ${activeLogDetail ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50/75 border-b border-slate-100 sticky top-0">
                    <TableRow>
                      <TableCell className="py-2.5 pl-4 text-[11px] font-semibold text-slate-600 text-left">เวลา</TableCell>
                      <TableCell className="py-2.5 text-[11px] font-semibold text-slate-600 text-left">เหตุการณ์</TableCell>
                      <TableCell className="py-2.5 text-[11px] font-semibold text-slate-600 text-center">ผลลัพธ์ (Code)</TableCell>
                      <TableCell className="py-2.5 pr-4 text-[11px] font-semibold text-slate-600 text-center">ดูดิบ</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingLogs ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                          กำลังโหลดข้อมูล...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                          ไม่มีการเรียกทำรายการย้อนหลังของ Webhook นี้
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => {
                        const isSuccess = log.status >= 200 && log.status < 300;
                        const date = new Date(log.createdAt).toLocaleString('th-TH', {
                          hour12: false,
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });

                        return (
                          <TableRow
                            key={log.id}
                            className={`hover:bg-slate-50/50 cursor-pointer ${
                              activeLogDetail?.id === log.id ? 'bg-indigo-50/20' : ''
                            }`}
                            onClick={() => setActiveLogDetail(log)}
                          >
                            <TableCell className="py-2.5 pl-4 font-mono text-[10px] text-slate-500">{date}</TableCell>
                            <TableCell className="py-2.5 font-bold text-[10px] text-slate-700">{log.event}</TableCell>
                            <TableCell className="py-2.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isSuccess
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}
                              >
                                {isSuccess ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                )}
                                <span>{log.status === 0 ? 'FAIL' : log.status}</span>
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 text-center pr-4">
                              <Eye className="w-3.5 h-3.5 mx-auto text-slate-400 hover:text-indigo-650" />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Log Details Detail Sidepanel */}
            {activeLogDetail && (
              <div className="lg:col-span-6 border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4 max-h-[50vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">รายละเอียด Payload</span>
                  <button
                    type="button"
                    onClick={() => setActiveLogDetail(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    ปิดส่วนขยาย
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">ข้อมูลส่งออก (Request Payload):</span>
                  <pre className="text-[10px] font-mono bg-white border border-slate-200 rounded p-2 overflow-x-auto text-slate-700 select-all max-h-[15vh]">
                    {JSON.stringify(JSON.parse(activeLogDetail.requestBody), null, 2)}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">ผลลัพธ์ตอบรับ (Response Body):</span>
                  {activeLogDetail.responseBody ? (
                    <pre className="text-[10px] font-mono bg-slate-900 border border-slate-800 rounded p-2 overflow-x-auto text-slate-300 max-h-[18vh]">
                      {activeLogDetail.responseBody}
                    </pre>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 italic block">ไม่มีเนื้อความการตอบกลับ</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-150 pt-3 flex justify-end mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" className="cursor-pointer">
                ปิดหน้าต่าง
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-650">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>ยืนยันการลบ Webhook</span>
            </DialogTitle>
            <DialogDescription>
              การดำเนินการนี้จะลบการตั้งค่าและประวัติผลการยิงข้อมูลทั้งหมดถาวร
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-red-50 border border-red-100 p-4 space-y-1 text-xs">
              <p className="font-semibold text-red-800">การเชื่อมต่อที่กำลังถูกลบ:</p>
              <p className="text-slate-800">
                ชื่อ: <span className="font-bold">{deletingWebhook?.name}</span>
              </p>
              <p className="text-slate-800 truncate">
                URL: <span className="font-mono">{deletingWebhook?.url}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" className="cursor-pointer" disabled={deleteLoading}>
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
              className="cursor-pointer"
            >
              {deleteLoading ? 'กำลังลบ...' : 'ยืนยันลบ Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Minimal placeholder AlertTriangle for modal imports
function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
