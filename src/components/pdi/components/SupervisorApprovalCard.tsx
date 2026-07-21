'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import SignatureCapture from '../SignatureCapture';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SupervisorApprovalCardProps {
  isQC: boolean;
  supervisorSig: string | null;
  onSupervisorSigChange: (sig: string | null) => void;
  onDecision: (decision: 'APPROVED' | 'REJECTED') => void;
  jobStatus: string;
}

export default function SupervisorApprovalCard({
  isQC,
  supervisorSig,
  onSupervisorSigChange,
  onDecision,
  jobStatus,
}: SupervisorApprovalCardProps) {
  return (
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
            onChange={onSupervisorSigChange}
            readOnly={jobStatus !== 'PENDING_APPROVAL' || !isQC}
          />
        </div>

        <div className="flex gap-3 pt-2">
          {isQC ? (
            <>
              <Button
                type="button"
                variant="danger"
                onClick={() => onDecision('REJECTED')}
                className="flex-1 sm:flex-none"
              >
                ปฏิเสธการตรวจ (Reject)
              </Button>
              <Button
                type="button"
                onClick={() => onDecision('APPROVED')}
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
  );
}
