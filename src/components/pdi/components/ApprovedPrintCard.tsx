'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer } from 'lucide-react';

export default function ApprovedPrintCard() {
  return (
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
  );
}
