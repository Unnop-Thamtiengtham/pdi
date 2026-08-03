'use client';

import React from 'react';
import { IdCard, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

// Import refactored modules
import { useUsers } from './hooks/useUsers';
import { UserFormCard } from './components/UserFormCard';
import { ConfirmDeleteUserDialog } from './components/ConfirmDeleteUserDialog';

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
  // Destructure hook state and handlers
  const {
    users,
    loading,
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
    handleEditClick,
    handleCancelEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    userToDelete,
    handleSubmit,
  } = useUsers({ initialUsers });

  const getRoleBadgeClass = (roleStr: string) => {
    switch (roleStr) {
      case 'MASTER':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50';
      case 'SUPER_ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50';
      case 'SALE':
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
        return 'Master';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'SALE':
        return 'Sales';
      case 'SUPERVISOR':
        return 'Supervisor / QC';
      case 'INSPECTOR':
      default:
        return 'Inspector';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">จัดการบัญชีผู้ใช้งาน (User Management)</h2>
          <p className="text-xs text-slate-500 mt-1">
            ลงทะเบียนพนักงานใหม่ กำหนดสิทธิ์บทบาทและสาขาที่สังกัด รวมถึงจัดการสถานะการเปิด/ปิดบัญชีใช้งาน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: User Registration Form Card */}
        <div className="lg:col-span-4">
          <UserFormCard
            editingUser={editingUser}
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            role={role}
            setRole={setRole}
            branchId={branchId}
            setBranchId={setBranchId}
            isActive={isActive}
            setIsActive={setIsActive}
            loading={loading}
            onCancelEdit={handleCancelEdit}
            onSubmit={handleSubmit}
            branches={branches}
          />
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
                  <TableHeader className="bg-slate-50/75 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="pl-6 py-3.5 text-xs font-semibold text-slate-600 text-left whitespace-nowrap align-middle">รหัสพนักงาน</TableHead>
                      <TableHead className="py-3.5 text-xs font-semibold text-slate-600 text-left whitespace-nowrap align-middle">ชื่อ - อีเมล</TableHead>
                      <TableHead className="py-3.5 text-xs font-semibold text-slate-600 text-left whitespace-nowrap align-middle">บทบาท (Role)</TableHead>
                      <TableHead className="py-3.5 text-xs font-semibold text-slate-600 text-left whitespace-nowrap align-middle">สาขาที่สังกัด</TableHead>
                      <TableHead className="py-3.5 text-xs font-semibold text-slate-600 text-left whitespace-nowrap align-middle">สถานะ</TableHead>
                      <TableHead className="pr-6 py-3.5 text-xs font-semibold text-slate-600 text-center whitespace-nowrap align-middle">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                          ไม่มีข้อมูลบัญชีผู้ใช้งานในระบบ
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id} className={`hover:bg-slate-50/50 transition-colors align-middle ${editingUser?.id === u.id ? 'bg-indigo-50/30' : ''}`}>
                          <TableCell className="pl-6 py-4 font-mono text-xs text-slate-800 font-bold whitespace-nowrap align-middle">{u.employeeId}</TableCell>
                          <TableCell className="py-4 whitespace-nowrap align-middle">
                            <div className="text-sm font-semibold text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                          </TableCell>
                          <TableCell className="py-4 whitespace-nowrap align-middle">
                            <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(u.role)}`}>
                              {getRoleLabel(u.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-xs text-slate-700 font-medium whitespace-nowrap align-middle">
                            {u.branch ? (
                              <span>
                                [{u.branch.code}] {u.branch.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">แอดมินกลาง (ไม่มีสังกัด)</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-xs whitespace-nowrap align-middle">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                ใช้งานปกติ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                ระงับใช้งาน
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="pr-6 py-4 whitespace-nowrap align-middle">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(u)}
                                className="border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 h-8 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">แก้ไข</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(u)}
                                className="border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 hover:text-rose-700 h-8 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">ลบ</span>
                              </Button>
                            </div>
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

      {/* Custom Confirmation Dialog for Deleting Users */}
      <ConfirmDeleteUserDialog
        open={userToDelete !== null}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
        onConfirm={handleConfirmDelete}
        userName={userToDelete?.name || ''}
        employeeId={userToDelete?.employeeId || ''}
        loading={loading}
      />
    </div>
  );
}
