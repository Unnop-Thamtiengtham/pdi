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
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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

  const getRoleBadgeClass = (roleStr: string) => {
    switch (roleStr) {
      case 'MASTER':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50';
      case 'SUPER_ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50';
      case 'ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
      case 'SUPERVISOR':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
      case 'INSPECTOR':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-wide">จัดการผู้ใช้งานในระบบ (User Management)</h2>
        <p className="text-xs text-slate-500 mt-1">
          ลงทะเบียนบัญชีสำหรับพนักงานผู้ตรวจสภาพ (Inspector), หัวหน้างาน (Supervisor/QC), แอดมินสาขา และผู้ดูแลระบบกลาง
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Add User Form */}
        <div className="lg:col-span-4">
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>เพิ่มผู้ใช้งานใหม่</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Employee ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId" className="text-xs font-semibold text-slate-700">รหัสพนักงาน (Employee ID) *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <Input
                      id="employeeId"
                      type="text"
                      placeholder="EMP-12345"
                      className="pl-9 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700">ชื่อพนักงาน *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <Input
                      id="name"
                      type="text"
                      placeholder="สมชาย ใจดี"
                      className="pl-9 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">อีเมล (Email Address) *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="somchai@pdi.com"
                      className="pl-9 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">รหัสผ่านสำหรับเข้าสู่ระบบ *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Role Select */}
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-semibold text-slate-700">บทบาทในระบบ (User Role) *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Shield className="w-4 h-4" />
                    </span>
                    <select
                      id="role"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
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
                    <Label htmlFor="branch" className="text-xs font-semibold text-slate-700">สังกัดสาขา (Branch) *</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Building className="w-4 h-4" />
                      </span>
                      <select
                        id="branch"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
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
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {loading ? 'กำลังบันทึก...' : 'ลงทะเบียนผู้ใช้งาน'}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Existing Users Table */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-indigo-600" />
                <span>รายชื่อผู้ใช้งานในระบบ ({users.length} คน)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                    <TableRow>
                      <th className="pl-6 py-3.5 text-xs font-semibold text-slate-700">รหัสพนักงาน</th>
                      <th className="py-3.5 text-xs font-semibold text-slate-700">ชื่อ - อีเมล</th>
                      <th className="py-3.5 text-xs font-semibold text-slate-700">บทบาท (Role)</th>
                      <th className="py-3.5 text-xs font-semibold text-slate-700">สาขาที่สังกัด</th>
                      <th className="py-3.5 text-xs font-semibold text-slate-700">สถานะ</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                          ไม่มีข้อมูลบัญชีผู้ใช้งานในระบบ
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="pl-6 py-4 font-mono text-xs text-slate-850 font-bold">{u.employeeId}</TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm font-semibold text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(u.role)}`}>
                              {getRoleLabel(u.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-xs text-slate-700 font-medium">
                            {u.branch ? (
                              <span>
                                [{u.branch.code}] {u.branch.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">แอดมินกลาง (ไม่มีสังกัด)</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-xs">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                ใช้งานปกติ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                ระงับใช้งาน
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
