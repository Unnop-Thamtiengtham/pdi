'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('กรุณากรอกรหัสพนักงาน/อีเมล และรหัสผ่าน');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background cyber glowing ambient circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-900/40 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md border border-card-border/80 bg-slate-950/40 backdrop-blur-md relative z-10 shadow-2xl">
        <CardHeader className="space-y-3 flex flex-col items-center text-center pb-6">
          {/* Logo SVG */}
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                d="M6 18 A 8.5 8.5 0 1 1 18 18"
                stroke="#5F6368"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M9.5 20.1 A 8.5 8.5 0 0 1 14.5 20.1"
                stroke="#5F6368"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M7.5 17.5L12 9l4.5 8.5"
                stroke="#30C0D0"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-left">
              <span className="text-xs font-black tracking-widest text-[#30C0D0] uppercase">GOLD</span>
              <h1 className="text-sm font-bold tracking-wider text-slate-300 -mt-1">INTEGRATE</h1>
            </div>
          </div>

          <CardTitle className="text-xl font-bold text-white tracking-wide">PDI Management System</CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            ลงชื่อเข้าใช้งานสำหรับช่างตรวจและเจ้าหน้าที่ฝ่ายควบคุมคุณภาพ
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-danger flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-slate-400 font-medium">
                รหัสพนักงาน หรือ อีเมล
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="เช่น EMP-INSPECT หรือ inspector@pdi.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-slate-400 font-medium">
                  รหัสผ่าน
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 h-10 text-xs font-semibold" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'ลงชื่อเข้าใช้งาน'}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}
