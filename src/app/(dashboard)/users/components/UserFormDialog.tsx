import React from 'react';
import { User, Mail, Lock, Shield, Building, UserPlus, Power } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: any;
  employeeId: string;
  setEmployeeId: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: any;
  setPassword: (val: string) => void;
  role: string;
  setRole: (val: string) => void;
  branchId: string;
  setBranchId: (val: string) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  branches: Branch[];
}

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  employeeId,
  setEmployeeId,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  branchId,
  setBranchId,
  isActive,
  setIsActive,
  loading,
  onCancel,
  onSubmit,
  branches,
}: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="flex items-center gap-2 text-slate-800 font-bold">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>{editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'ลงทะเบียนผู้ใช้งานใหม่'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {editingUser 
              ? 'แก้ไขข้อมูลบัญชีผู้ใช้งาน สิทธิ์บทบาทหน้าที่ และการเปิด/ปิดบัญชีใช้งาน' 
              : 'กรอกรายละเอียดพนักงานใหม่เพื่อทำการลงทะเบียนและกำหนดสิทธิ์เข้าใช้งานระบบ'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          
          {/* Employee ID */}
          <div className="space-y-1.5">
            <Label htmlFor="employeeId" className="text-xs font-semibold text-slate-700">รหัสพนักงาน *</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <Input
                id="employeeId"
                placeholder="เช่น PDI-001"
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">ชื่อ - นามสกุล *</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <Input
                id="name"
                placeholder="เช่น สมชาย ดีงาม"
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
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
              รหัสผ่านสำหรับเข้าสู่ระบบ {editingUser ? '(เว้นว่างไว้หากใช้รหัสเดิม)' : '*'}
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <Input
                id="password"
                type="password"
                placeholder={editingUser ? '•••••••• (เว้นว่างไว้เพื่อใช้รหัสเดิม)' : '••••••••'}
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingUser}
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
                required
              >
                <option value="">-- เลือกบทบาทในระบบ --</option>
                <option value="INSPECTOR">Inspector</option>
                <option value="SUPERVISOR">Supervisor / QC</option>
                <option value="SALE">Sales</option>
                <option value="MASTER">Master</option>
              </select>
            </div>
          </div>

          {/* Branch Select (Hidden for global roles) */}
          {role !== 'MASTER' && (
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

          {/* Status Toggle (Show only on Edit Mode) */}
          {editingUser && (
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-slate-700">สถานะการใช้งาน *</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Power className="w-4 h-4" />
                </span>
                <select
                  id="status"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow"
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                >
                  <option value="true">เปิดใช้งานปกติ</option>
                  <option value="false">ระงับการใช้งาน</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="border-t border-slate-100 pt-3 mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="py-2 rounded-lg border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer"
                disabled={loading}
              >
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'กำลังบันทึก...' : editingUser ? 'บันทึกแก้ไข' : 'ลงทะเบียนผู้ใช้งาน'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}