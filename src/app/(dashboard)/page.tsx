import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { ShieldAlert, Database } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  let dbJobs: any[] = [];
  let isDbConnected = true;
  let connectionError = '';

  try {
    // Attempt database query
    dbJobs = await prisma.pdiJob.findMany({
      include: {
        vehicle: {
          include: { branch: true },
        },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (error: any) {
    console.warn('Database connection failed. Falling back to mock data. Error:', error.message);
    isDbConnected = false;
    connectionError = error.message;
  }

  return (
    <div className="space-y-6">
      {/* DB Status Warning Banner */}
      {!isDbConnected && (
        <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 text-warning flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <Database className="w-5 h-5 mt-0.5 text-warning flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">ระบบกำลังทำงานในโหมดจำลอง (Mock Data Mode)</h4>
              <p className="text-xs text-slate-400 mt-1">
                ไม่พบการเชื่อมต่อฐานข้อมูลเนื่องจากไม่ได้ระบุ `DATABASE_URL` ในไฟล์ `.env` ของโครงการ 
                กรุณาเพิ่ม URL และรันชุดคำสั่ง `npx prisma db push && npx prisma db seed` เพื่อเข้าสู่การทำงานจริง
              </p>
            </div>
          </div>
          <div className="text-xs font-mono bg-slate-900 border border-card-border px-3 py-1.5 rounded-lg text-slate-400 select-all max-w-xs truncate">
            DATABASE_URL="postgresql://..."
          </div>
        </div>
      )}

      {/* Main Dashboard Client Workspace */}
      <DashboardClient initialJobs={dbJobs} isDbConnected={isDbConnected} />
    </div>
  );
}
