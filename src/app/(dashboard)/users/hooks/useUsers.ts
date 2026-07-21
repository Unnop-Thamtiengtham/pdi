import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

interface UseUsersProps {
  initialUsers: UserData[];
}

export function useUsers({ initialUsers }: UseUsersProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [loading, setLoading] = useState(false);

  // Edit Mode state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INSPECTOR');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleEditClick = (u: UserData) => {
    setEditingUser(u);
    setEmployeeId(u.employeeId);
    setName(u.name);
    setEmail(u.email || '');
    setRole(u.role);
    setBranchId(u.branchId || '');
    setPassword('');
    setIsActive(u.isActive);
    toast.info(`กำลังแก้ไขข้อมูลของ ${u.name}`);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEmployeeId('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('INSPECTOR');
    setBranchId('');
    setIsActive(true);
  };

  const handleDeleteClick = async (u: UserData) => {
    if (u.role === 'MASTER') {
      toast.error('ไม่สามารถลบผู้ใช้งานสิทธิ์ MASTER ได้');
      return;
    }

    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${u.name}" (${u.employeeId}) ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users?userId=${u.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
      }

      toast.success(`ลบผู้ใช้งานคุณ ${u.name} สำเร็จแล้ว!`);

      if (editingUser?.id === u.id) {
        handleCancelEdit();
      }

      router.refresh();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !name || !email || !role) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!editingUser && !password) {
      toast.error('กรุณากรอกรหัสผ่านสำหรับผู้ใช้งานใหม่');
      return;
    }

    setLoading(true);
    try {
      const url = '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const payload = {
        userId: editingUser?.id,
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        role,
        branchId: role === 'MASTER' || role === 'SUPER_ADMIN' ? null : branchId || null,
        isActive: editingUser ? isActive : true,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      toast.success(editingUser ? `แก้ไขข้อมูลคุณ ${name} สำเร็จ!` : `เพิ่มผู้ใช้งาน ${name} สำเร็จแล้ว!`);
      
      handleCancelEdit();
      router.refresh();
      
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

  return {
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
    handleSubmit,
  };
}
