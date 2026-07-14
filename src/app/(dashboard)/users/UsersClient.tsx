'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Building, 
  UserPlus, 
  Key, 
  IdCard 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface UserData {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  branchId: string | null;
  branch: Branch | null;
}

interface UsersClientProps {
  initialUsers: UserData[];
  branches: Branch[];
}

export default function UsersClient({ initialUsers, branches }: UsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [loading, setLoading] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INSPECTOR');
  const [branchId, setBranchId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !name || !email || !password || !role) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          branchId: role === 'MASTER' || role === 'SUPER_ADMIN' ? null : branchId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
      }

      toast.success(`เพิ่มผู้ใช้งาน ${name} สำเร็จแล้ว!`);
      
      // Clear form
      setEmployeeId('');
      setName('');
      setEmail('');
      setPassword('');
      setRole('INSPECTOR');
      setBranchId('');

      // Refresh data
      router.refresh();
      
      // Refresh local list
      const fetchUsers = await fetch('/api/users');
      if (fetchUsers.ok) {
        const updatedList = await fetchUsers.json();
        setUsers(updatedList);
      }

    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (roleStr: string) => {
    switch (roleStr) {
      case 'MASTER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      case 'SUPER_ADMIN':
        return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'SUPERVISOR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'INSPECTOR':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    }
  };

  const getRoleLabel = (roleStr: string) => {
    switch (roleStr) {
      case 'MASTER':
        return 'MASTER (สิทธิ์สูงสุด)';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'SUPERVISOR':
        return 'Supervisor / QC';
      case 'INSPECTOR':
      default:
        return 'ช่างตรวจสภาพ';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left: Add User Form */}
      <div className="lg:col-span-4">
        <Card className="border-card-border bg-slate-900/65 backdrop-blur-md">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Employee ID */}
              <div className="space-y-1.5">
                <Label htmlFor="employeeId" className="text-xs font-semibold text-slate-300">รหัสพนักงาน (Employee ID) *</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="EMP-12345"
                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-300">ชื่อพนักงาน *</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <Input
                    id="name"
                    type="text"
                    placeholder="สมชาย ใจดี"
                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-300">อีเมล (Email Address) *</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="somchai@pdi.com"
                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300">รหัสผ่านสำหรับเข้าสู่ระบบ *</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-semibold text-slate-300">บทบาทในระบบ (User Role) *</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Shield className="w-4 h-4" />
                  </span>
                  <select
                    id="role"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-indigo-500 focus:outline-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="INSPECTOR">ช่างตรวจสภาพ (INSPECTOR)</option>
                    <option value="SUPERVISOR">Supervisor / QC (SUPERVISOR)</option>
                    <option value="ADMIN">Admin สาขา (ADMIN)</option>
                    <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
                    <option value="MASTER">MASTER (สิทธิ์สูงสุด)</option>
                  </select>
                </div>
              </div>

              {/* Branch Select (Hidden for global roles) */}
              {role !== 'MASTER' && role !== 'SUPER_ADMIN' && (
                <div className="space-y-1.5">
                  <Label htmlFor="branch" className="text-xs font-semibold text-slate-300">สังกัดสาขา (Branch) *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Building className="w-4 h-4" />
                    </span>
                    <select
                      id="branch"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-indigo-500 focus:outline-none"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      required
                    >
                      <option value="">-- เลือกสาขาที่สังกัด --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          [{b.code}] {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-colors"
              >
                {loading ? 'กำลังบันทึก...' : 'ลงทะเบียนผู้ใช้งาน'}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Existing Users Table */}
      <div className="lg:col-span-8">
        <Card className="border-card-border bg-slate-900/65 backdrop-blur-md">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <IdCard className="w-5 h-5 text-indigo-500" />
              <span>รายชื่อผู้ใช้งานในระบบ ({users.length} คน)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/75 border-b border-slate-800">
                    <th className="pl-6 py-3.5 text-xs font-semibold text-slate-400">รหัสพนักงาน</th>
                    <th className="py-3.5 text-xs font-semibold text-slate-400">ชื่อ - อีเมล</th>
                    <th className="py-3.5 text-xs font-semibold text-slate-400">บทบาท (Role)</th>
                    <th className="py-3.5 text-xs font-semibold text-slate-400">สาขาที่สังกัด</th>
                    <th className="py-3.5 text-xs font-semibold text-slate-400">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                        ไม่มีข้อมูลบัญชีผู้ใช้งานในระบบ
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/25 transition-colors">
                        <td className="pl-6 py-4 font-mono text-xs text-slate-300 font-semibold">{u.employeeId}</td>
                        <td className="py-4">
                          <div className="text-sm font-semibold text-white">{u.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-300 font-medium">
                          {u.branch ? (
                            <span>
                              [{u.branch.code}] {u.branch.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-normal">แอดมินกลาง (ไม่มีสังกัด)</span>
                          )}
                        </td>
                        <td className="py-4 text-xs">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              ใช้งานปกติ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              ระงับใช้งาน
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
