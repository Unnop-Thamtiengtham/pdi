'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ChecklistForm from './ChecklistForm';
import PdiPrintReport from './PdiPrintReport';
import SignatureCapture from './SignatureCapture';
import PhotoUpload from './PhotoUpload';
import { FileText, ShieldAlert, Sparkles, CheckCircle2, UserCheck, AlertTriangle, ArrowLeft, Printer, Play } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PdiWorkspaceClientProps {
  jobId: string;
  initialJob: any;
  isDbConnected: boolean;
}

export default function PdiWorkspaceClient({ jobId, initialJob, isDbConnected }: PdiWorkspaceClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // PDPA/Handover states for Pre-Delivery PDI
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [customerSig, setCustomerSig] = useState<string | null>(null);
  const [inspectorSig, setInspectorSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);

  // Hardcoded mockup data for template checklist items (similar to seeded AION V template)
  const getMockTemplateItems = () => {
    return [
      { id: 'item-1', category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_001', itemName: 'ประตูรอบคันรถ', itemOrder: 1, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-2', category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_002', itemName: 'ฝากระโปรงหน้า/หลัง', itemOrder: 2, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-3', category: 'ลักษณะภายนอกและสี', categoryOrder: 1, itemCode: 'EXT_003', itemName: 'กันชนหน้าและหลัง', itemOrder: 3, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-4', category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_001', itemName: 'ไฟหน้าส่องสว่าง', itemOrder: 1, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-5', category: 'ไฟส่องสว่าง', categoryOrder: 2, itemCode: 'LGT_002', itemName: 'ไฟเลี้ยวซ้าย/ขวา', itemOrder: 2, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-6', category: 'กระจกและที่ปัดน้ำฝน', categoryOrder: 3, itemCode: 'GLS_001', itemName: 'ฟังก์ชันกระจกประตูเลื่อนขึ้นลง', itemOrder: 1, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-7', category: 'ระบบปรับอากาศ', categoryOrder: 4, itemCode: 'AC_001', itemName: 'การทำงานของระบบปรับอากาศในรถ', itemOrder: 1, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-8', category: 'ตรวจสอบระดับของเหลว', categoryOrder: 6, itemCode: 'FLD_001', itemName: 'ระดับน้ำยาหล่อเย็นมอเตอร์', itemOrder: 1, isMandatory: true, hasPhoto: false, hasNumeric: false },
      { id: 'item-9', category: 'ตรวจสอบแบตเตอรี่ 12V', categoryOrder: 9, itemCode: 'BAT_001', itemName: 'ค่าแรงดันไฟฟ้าแบตเตอรี่หลัก (Voltage)', itemOrder: 1, isMandatory: true, hasPhoto: false, hasNumeric: true, numericUnit: 'V', numericMin: 12.6 },
      { id: 'item-10', category: 'ตรวจสอบแบตเตอรี่ 12V', categoryOrder: 9, itemCode: 'BAT_002', itemName: 'ค่าสุขภาพแบตเตอรี่ SOH', itemOrder: 2, isMandatory: true, hasPhoto: false, hasNumeric: true, numericUnit: '%', numericMin: 80 },
    ];
  };

  // Load Job and Template
  useEffect(() => {
    async function loadData() {
      if (isDbConnected && initialJob) {
        setJob(initialJob);
        setCustomerSig(initialJob.customerSig || null);
        setInspectorSig(initialJob.inspectorSig || null);
        setSupervisorSig(initialJob.supervisorSig || null);
        setPdpaConsent(initialJob.pdpaConsent || false);
        // Fetch template
        try {
          const res = await fetch(`/api/checklist/${initialJob.vehicle.modelCode}?type=${initialJob.pdiType}`);
          if (res.ok) {
            const temp = await res.json();
            setTemplateItems(temp.items || []);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        // Mocking setup
        const mockJob = {
          id: jobId,
          jobNumber: jobId.startsWith('mock-inc') ? 'JO-INC-20260609-001' : jobId.startsWith('mock-ltm') ? 'JO-LTM-20260609-001' : 'JO-PD-20260609-001',
          pdiType: jobId.startsWith('mock-inc') ? 'INCOMING' : jobId.startsWith('mock-ltm') ? 'LONG_TERM' : 'PRE_DELIVERY',
          status: 'PENDING',
          vehicleVin: 'LNAT4AB34T5G05011',
          vehicle: {
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
            incomingDeadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
            branch: { name: 'มีนบุรี' }
          },
          inspector: null,
          approver: null,
          checklistItems: [],
          defects: [],
          notes: '',
        };
        setJob(mockJob);
        setTemplateItems(getMockTemplateItems());
      }
      setLoading(false);
    }
    loadData();
  }, [jobId, initialJob, isDbConnected]);

  const handleStartJob = async () => {
    if (readOnly) return;
    
    const nextStatus = 'IN_PROGRESS';
    const currentUserId = session?.user?.id || 'mock-user-id';

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            status: nextStatus,
            inspectorId: currentUserId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update job');
        }
        const updated = await res.json();
        setJob({ ...job, status: updated.status, inspectorId: updated.inspectorId });
      } else {
        setJob({
          ...job,
          status: nextStatus,
          inspector: { name: session?.user?.name || 'สมชาย ช่างตรวจ' },
        });
      }
      window.dispatchEvent(new Event('pdi-job-updated'));
      toast.success('เริ่มดำเนินการตรวจรถแล้ว');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ไม่สามารถเริ่มงานตรวจได้');
    }
  };

  const handleSaveResults = async (resultsPayload: any[], batteryPayload: any, defectsPayload: any[]) => {
    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            results: resultsPayload,
            batteryData: batteryPayload,
            defects: defectsPayload,
            status: 'IN_PROGRESS',
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to save results');
        }
      }
      // Update local state
      setJob({
        ...job,
        checklistItems: resultsPayload,
        defects: defectsPayload,
        batteryTestResult: batteryPayload,
      });
      window.dispatchEvent(new Event('pdi-job-updated'));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ไม่สามารถบันทึกแบบร่างได้');
    }
  };

  const handleSubmitResults = async (resultsPayload: any[], batteryPayload: any, defectsPayload: any[]) => {
    // Check if there are any FAIL results or open/in-progress defects
    const hasFailResults = resultsPayload.some(r => r.result === 'FAIL');
    const hasUnresolvedDefects = defectsPayload.some(d => d.status === 'OPEN' || d.status === 'IN_REPAIR');
    const isFailed = hasFailResults || hasUnresolvedDefects;
    
    const nextStatus = isFailed ? 'DEFECT_FOUND' : 'PENDING_APPROVAL';

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            results: resultsPayload,
            batteryData: batteryPayload,
            defects: defectsPayload,
            status: nextStatus,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to submit results');
        }
      }
      setJob({
        ...job,
        status: nextStatus,
        checklistItems: resultsPayload,
        defects: defectsPayload,
        batteryTestResult: batteryPayload,
      });
      window.dispatchEvent(new Event('pdi-job-updated'));
      
      if (isFailed) {
        toast.success('พบจุดบกพร่อง', { description: 'ส่งรถไปปรับสภาพซ่อมเรียบร้อยแล้ว' });
        router.push('/pdi/repairs');
      } else {
        toast.success('ส่งผลงานตรวจสำเร็จ', { description: 'ส่งให้ Supervisor พิจารณาเรียบร้อยแล้ว' });
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ไม่สามารถส่งบันทึกผลการตรวจได้');
    }
  };

  // Helper to upload base64 drawing to S3
  const uploadBase64Image = async (base64Data: string, fileName: string): Promise<string> => {
    const res = await fetch(base64Data);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!uploadRes.ok) {
      throw new Error('ไม่สามารถอัปโหลดรูปภาพลายเซ็นไปยัง S3 ได้');
    }
    const data = await uploadRes.json();
    return data.fileUrl;
  };

  // Supervisor Approval Action
  const handleSupervisorDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'APPROVED' && !supervisorSig) {
      toast.warning('กรุณาลงลายมือชื่อ', { description: 'กรุณาเซ็นชื่อเพื่ออนุมัติรายงานผลการตรวจสภาพรถ' });
      return;
    }

    const currentUserId = session?.user?.id || 'mock-supervisor-id';

    let uploadedCustomerSig = customerSig;
    let uploadedInspectorSig = inspectorSig;
    let uploadedSupervisorSig = supervisorSig;

    try {
      if (decision === 'APPROVED') {
        toast.info('กำลังอัปโหลดรูปภาพลายเซ็นไปยัง S3...');
        if (customerSig && customerSig.startsWith('data:image/')) {
          uploadedCustomerSig = await uploadBase64Image(customerSig, `customer_sig_${job.id}.png`);
        }
        if (inspectorSig && inspectorSig.startsWith('data:image/')) {
          uploadedInspectorSig = await uploadBase64Image(inspectorSig, `inspector_sig_${job.id}.png`);
        }
        if (supervisorSig && supervisorSig.startsWith('data:image/')) {
          uploadedSupervisorSig = await uploadBase64Image(supervisorSig, `supervisor_sig_${job.id}.png`);
        }
      }

      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            status: decision,
            approverId: currentUserId,
            customerSig: uploadedCustomerSig,
            inspectorSig: uploadedInspectorSig,
            supervisorSig: uploadedSupervisorSig,
            pdpaConsent: pdpaConsent,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to save decision');
        }
      }

      if (decision === 'APPROVED') {
        toast.success('อนุมัติผ่านงานตรวจสภาพสำเร็จ');
      } else {
        toast.info('ปฏิเสธผลงานตรวจและส่งกลับให้แก้ไข');
      }
      setJob({
        ...job,
        status: decision,
        approver: { name: session?.user?.name || 'ธีรพล QC' },
        customerSig: uploadedCustomerSig,
        inspectorSig: uploadedInspectorSig,
        supervisorSig: uploadedSupervisorSig,
        pdpaConsent: pdpaConsent,
      });
      window.dispatchEvent(new Event('pdi-job-updated'));
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการส่งการอนุมัติ');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">กำลังโหลดพื้นที่ปฏิบัติงาน...</div>;
  }

  const userRole = session?.user?.role || 'INSPECTOR';
  const isInspector = userRole === 'INSPECTOR' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isQC = userRole === 'SUPERVISOR' || userRole === 'BRANCH_MANAGER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  const readOnly = job.status === 'APPROVED' || job.status === 'PENDING_APPROVAL';

  return (
    <div className="space-y-6">
      {/* Full Print Report (Only visible in Print preview) */}
      <PdiPrintReport
        job={job}
        templateItems={templateItems}
        signatures={{
          customer: customerSig,
          inspector: inspectorSig,
          supervisor: supervisorSig,
        }}
      />

      {/* Main workspace layout */}
      <div className="print:hidden space-y-6">
        {job.status === 'PENDING' ? (
          <Card className="max-w-lg mx-auto text-center p-8 space-y-6 mt-12 border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal mx-auto animate-pulse">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">พร้อมตรวจสภาพรถยนต์ไฟฟ้า</h3>
              <p className="text-xs text-slate-500">
                รถยนต์ไฟฟ้า เลขตัวถัง <span className="font-mono text-slate-800 font-semibold">{job.vehicleVin}</span> ({job.vehicle?.modelName})
                ถูกจ่ายงานเข้ามาแล้ว กดปุ่มด้านล่างเพื่อเปลี่ยนสถานะเป็นกำลังตรวจ (In Progress)
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/">
                <Button variant="secondary" size="sm">ย้อนกลับ</Button>
              </Link>
              <Button onClick={handleStartJob} className="gap-1.5" size="sm">
                <Play className="w-4 h-4 text-slate-950 fill-current" />
                <span>เริ่มปฏิบัติงานตรวจรถ</span>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Main Workspace content */}
            <ChecklistForm
              jobId={job.id}
              modelCode={job.vehicle?.modelCode || 'AION_V'}
              pdiType={job.pdiType}
              templateItems={templateItems}
              initialResults={job.checklistItems}
              initialBatteryData={job.batteryTestResult || {}}
              initialDefects={job.defects}
              onSave={handleSaveResults}
              onSubmit={handleSubmitResults}
              readOnly={readOnly}
            />

            {/* Supervisor Approval Block (Only visible when status is PENDING_APPROVAL and user is supervisor) */}
            {job.status === 'PENDING_APPROVAL' && (
              <Card className="border border-warning/20 bg-warning/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-warning flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                    <span>QC Supervisor Review Workspace</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">ตรวจสอบผลงานตรวจสอบและพิจารณาตัดสินอนุมัติหรือปฏิเสธกลับไปให้ตรวจใหม่</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Supervisor Sign-off Canvas */}
                  <div className="max-w-md space-y-2">
                    <Label className="text-xs text-slate-500">ลายมือชื่อผู้อนุมัติ (Supervisor Signature) *</Label>
                    <SignatureCapture
                      value={supervisorSig}
                      onChange={setSupervisorSig}
                      readOnly={job.status !== 'PENDING_APPROVAL' || !isQC}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    {isQC ? (
                      <>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleSupervisorDecision('REJECTED')}
                          className="flex-1 sm:flex-none"
                        >
                          ปฏิเสธการตรวจ (Reject)
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleSupervisorDecision('APPROVED')}
                          className="flex-1 sm:flex-none gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-950 fill-current" />
                          อนุมัติผ่านสภาพรถ (Approve)
                        </Button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-warning" />
                        <span>สถานะ: รอ QC/Supervisor เข้ามาทำการลงลายมือชื่ออนุมัติผลการตรวจนี้</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Print Report Action (Only visible when APPROVED) */}
            {job.status === 'APPROVED' && (
              <Card className="border border-success/20 bg-success/5 shadow-sm no-print">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">อนุมัติเรียบร้อย (PDI Approved)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">ผลการตรวจสมบูรณ์ผ่านเกณฑ์ คุณสามารถสั่งพิมพ์เอกสารรายงานสภาพรถและแบตเตอรี่ได้ทันที</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="gap-1.5 text-xs font-semibold border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์รายงาน PDI / พิมพ์ Job Order</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
