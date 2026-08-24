'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer } from 'lucide-react';

interface ApprovedPrintCardProps {
  jobId: string;
  modelCode: string;
}

export default function ApprovedPrintCard({ jobId, modelCode }: ApprovedPrintCardProps) {
  const isPdfSupported = ['AION_V', 'AION_V5', 'AION_YP', 'AION_YP5', 'AION_UT', 'HYPTEC_HT', 'HYPTEC_HT8'].includes(modelCode);

  return (
    <Card className="border border-success/20 bg-success/5 shadow-sm no-print">
      <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">อนุมัติเรียบร้อย (PDI Approved)</h4>
            <p className="text-xs text-slate-500 mt-0.5">ผลการตรวจสมบูรณ์ผ่านเกณฑ์ คุณสามารถสั่งพิมพ์หรือดาวน์โหลดรายงานแบบฟอร์มจริงได้ทันที</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="gap-1.5 text-xs font-semibold border-brand-teal text-brand-teal hover:bg-brand-teal/10 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน PDI / พิมพ์ Job Order</span>
          </Button>

          {isPdfSupported && (
            <a href={`/api/pdi-jobs/${jobId}/pdf`} download>
              <Button
                type="button"
                className="gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer px-4 py-2 rounded-lg"
              >
                <span>ดาวน์โหลด PDF แบบฟอร์มจริง</span>
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
