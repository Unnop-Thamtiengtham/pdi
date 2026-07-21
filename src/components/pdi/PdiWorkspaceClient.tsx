'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChecklistForm from './ChecklistForm';
import PdiPrintReport from './PdiPrintReport';
import SupervisorApprovalCard from './components/SupervisorApprovalCard';
import ApprovedPrintCard from './components/ApprovedPrintCard';
import { usePdiWorkspace } from './hooks/usePdiWorkspace';
import { FileText, ShieldAlert, AlertTriangle, Play } from 'lucide-react';
import Link from 'next/link';

interface PdiWorkspaceClientProps {
  jobId: string;
  initialJob: any;
  isDbConnected: boolean;
}

export default function PdiWorkspaceClient({ jobId, initialJob, isDbConnected }: PdiWorkspaceClientProps) {
  const {
    job,
    templateItems,
    loading,
    loadError,
    customerSig,
    inspectorSig,
    supervisorSig,
    setSupervisorSig,
    isQC,
    isStartJobBlocked,
    readOnly,
    handleStartJob,
    handleSaveResults,
    handleSubmitResults,
    handleSupervisorDecision,
  } = usePdiWorkspace({ jobId, initialJob, isDbConnected });

  // --- Loading state ---
  if (loading) {
    return <div className="text-center py-20 text-slate-500">กำลังโหลดพื้นที่ปฏิบัติงาน...</div>;
  }

  // --- Error state ---
  if (loadError || !job) {
    return (
      <Card className="max-w-lg mx-auto text-center p-8 space-y-4 mt-12 border border-error/20">
        <AlertTriangle className="w-10 h-10 text-error mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">ไม่สามารถโหลดข้อมูลได้</h3>
        <p className="text-sm text-slate-500">{loadError || 'ไม่พบข้อมูลใบงาน'}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/">
            <Button variant="secondary" size="sm">กลับหน้าหลัก</Button>
          </Link>
          <Button size="sm" onClick={() => window.location.reload()}>
            รีเฟรชหน้าเว็บ
          </Button>
        </div>
      </Card>
    );
  }

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
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex justify-center gap-3">
                <Link href="/">
                  <Button variant="secondary" size="sm">ย้อนกลับ</Button>
                </Link>
                {!isStartJobBlocked && (
                  <Button onClick={handleStartJob} className="gap-1.5" size="sm">
                    <Play className="w-4 h-4 text-slate-950 fill-current" />
                    <span>เริ่มปฏิบัติงานตรวจรถ</span>
                  </Button>
                )}
              </div>
              {isStartJobBlocked && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>บัญชีผู้ดูแลระบบ (Admin) ไม่สามารถเริ่มปฏิบัติงานหรือทำการตรวจสภาพรถได้</span>
                </p>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Main Workspace content */}
            <ChecklistForm
              jobId={job.id}
              modelCode={job.vehicle.modelCode}
              pdiType={job.pdiType}
              vehicleVin={job.vehicleVin}
              jobNumber={job.jobNumber}
              isApproved={job.status === 'APPROVED'}
              templateItems={templateItems}
              initialResults={job.checklistItems}
              initialBatteryData={job.batteryTestResult || {}}
              initialDefects={job.defects}
              initialDocuments={job.documents || []}
              onSave={handleSaveResults}
              onSubmit={handleSubmitResults}
              readOnly={readOnly}
            />

            {/* Supervisor Approval Block */}
            {job.status === 'PENDING_APPROVAL' && (
              <SupervisorApprovalCard
                isQC={isQC}
                supervisorSig={supervisorSig}
                onSupervisorSigChange={setSupervisorSig}
                onDecision={handleSupervisorDecision}
                jobStatus={job.status}
              />
            )}

            {/* Print Report Action (Only visible when APPROVED) */}
            {job.status === 'APPROVED' && <ApprovedPrintCard />}
          </>
        )}
      </div>
    </div>
  );
}
