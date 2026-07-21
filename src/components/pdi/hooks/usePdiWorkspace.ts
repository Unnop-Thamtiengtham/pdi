'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UsePdiWorkspaceOptions {
  jobId: string;
  initialJob: any;
  isDbConnected: boolean;
}

export function usePdiWorkspace({ jobId, initialJob, isDbConnected }: UsePdiWorkspaceOptions) {
  const { data: session } = useSession();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // PDPA/Handover states for Pre-Delivery PDI
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [customerSig, setCustomerSig] = useState<string | null>(null);
  const [inspectorSig, setInspectorSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);

  // Derived role flags
  const userRole = session?.user?.role || 'INSPECTOR';
  const isInspector = userRole === 'INSPECTOR' || userRole === 'SALE' || userRole === 'SUPER_ADMIN' || userRole === 'MASTER';
  const isQC = userRole === 'SUPERVISOR' || userRole === 'SALE' || userRole === 'SUPER_ADMIN' || userRole === 'MASTER';
  const isIncomingTickingBlocked = job?.pdiType === 'INCOMING' && userRole === 'SALE';
  const isStartJobBlocked = userRole === 'SALE';
  const readOnly = job?.status === 'APPROVED' || job?.status === 'PENDING_APPROVAL' || isIncomingTickingBlocked;

  // Load Job and Template
  useEffect(() => {
    async function loadData() {
      if (!isDbConnected || !initialJob) {
        setLoadError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณารีเฟรชหน้าเว็บ');
        setLoading(false);
        return;
      }

      setJob(initialJob);
      setCustomerSig(initialJob.customerSig || null);
      setInspectorSig(initialJob.inspectorSig || null);
      setSupervisorSig(initialJob.supervisorSig || null);
      setPdpaConsent(initialJob.pdpaConsent || false);

      // Fetch checklist template by vehicle modelCode
      const modelCode = initialJob.vehicle?.modelCode;
      if (!modelCode) {
        setLoadError(`ไม่พบรหัสรุ่นรถ (modelCode) สำหรับ VIN: ${initialJob.vehicleVin}`);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/checklist/${modelCode}?type=${initialJob.pdiType}`);
        if (res.ok) {
          const temp = await res.json();
          if (temp.items && temp.items.length > 0) {
            setTemplateItems(temp.items);
          } else {
            setLoadError(`ไม่พบรายการ checklist สำหรับรุ่น ${modelCode} (${initialJob.pdiType})`);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setLoadError(errData.error || `ไม่พบ template checklist สำหรับรุ่น ${modelCode}`);
        }
      } catch (err) {
        console.error('Failed to fetch checklist template:', err);
        setLoadError('ไม่สามารถโหลดรายการ checklist ได้ กรุณารีเฟรชหน้าเว็บ');
      }

      setLoading(false);
    }
    loadData();
  }, [jobId, initialJob, isDbConnected]);

  // Helper to upload base64 drawing to S3
  const uploadBase64Image = async (base64Data: string, fileName: string): Promise<string> => {
    const res = await fetch(base64Data);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('folder', 'PDI/signature');
    
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

  const handleSupervisorDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'APPROVED' && !supervisorSig) {
      toast.warning('กรุณาลงลายมือชื่อ', { description: 'กรุณาเซ็นชื่อเพื่ออนุมัติรายงานผลการตรวจสภาพรถ' });
      return;
    }

    const currentUserId = session?.user?.id || 'mock-supervisor-id';

    let uploadedCustomerSig = customerSig;
    let uploadedInspectorSig = inspectorSig;
    let uploadedSupervisorSig = supervisorSig;

    let toastId: string | number | undefined;

    try {
      if (decision === 'APPROVED') {
        toastId = toast.loading('กำลังอัปโหลดรูปภาพลายเซ็นไปยัง S3...');
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

      if (toastId) {
        toast.dismiss(toastId);
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
      if (toastId) {
        toast.dismiss(toastId);
      }
      console.error(err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการส่งการอนุมัติ');
    }
  };

  return {
    // State
    job,
    templateItems,
    loading,
    loadError,
    // Signature states
    pdpaConsent,
    setPdpaConsent,
    customerSig,
    setCustomerSig,
    inspectorSig,
    setInspectorSig,
    supervisorSig,
    setSupervisorSig,
    // Role flags
    isInspector,
    isQC,
    isStartJobBlocked,
    readOnly,
    // Actions
    handleStartJob,
    handleSaveResults,
    handleSubmitResults,
    handleSupervisorDecision,
  };
}
