import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseVehicleDetailProps {
  initialVehicle: any;
  vin: string;
  isDbConnected: boolean;
  dbBranches: any[];
}

export function useVehicleDetail({ initialVehicle, vin, isDbConnected, dbBranches }: UseVehicleDetailProps) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [loading, setLoading] = useState(false);

  // Manual Trigger Modals States
  const [isLtmOpen, setIsLtmOpen] = useState(false);
  const [ltmInterval, setLtmInterval] = useState('30');
  const [ltmScheduledDate, setLtmScheduledDate] = useState('');

  const [isPdOpen, setIsPdOpen] = useState(false);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [salesName, setSalesName] = useState('');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesBranch, setSalesBranch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Edit Vehicle Details state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editVin, setEditVin] = useState(initialVehicle.vin);
  const [editModelCode, setEditModelCode] = useState(initialVehicle.modelCode || 'AION_V');
  const [editColorName, setEditColorName] = useState(initialVehicle.colorName || '');
  const [editExteriorColor, setEditExteriorColor] = useState(initialVehicle.exteriorColor || '');
  const [editInteriorColor, setEditInteriorColor] = useState(initialVehicle.interiorColor || '');
  const [editProductionYear, setEditProductionYear] = useState(String(initialVehicle.productionYear || 2026));
  const [editWsDate, setEditWsDate] = useState(initialVehicle.wsDate ? new Date(initialVehicle.wsDate).toISOString().slice(0, 10) : '');
  const [editMotorBatteryNumber, setEditMotorBatteryNumber] = useState(initialVehicle.motorBatteryNumber || '');
  const [editWarehouse, setEditWarehouse] = useState(initialVehicle.warehouse || '');
  const [editFloorplan, setEditFloorplan] = useState(initialVehicle.floorplan || '');
  const [editBranchId, setEditBranchId] = useState(initialVehicle.branchId || '');
  const [editLoading, setEditLoading] = useState(false);

  // Image Preview Lightbox state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isDbConnected) {
      setVehicle(initialVehicle);
    }
  }, [initialVehicle, isDbConnected]);

  // Manual Long-term Job Submit
  const handleTriggerLtm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ltmScheduledDate) {
      toast.warning('กรุณาระบุวันที่กำหนดตรวจ');
      return;
    }

    setLoading(true);
    const payload = {
      pdiType: 'LONG_TERM',
      vehicleVin: vin,
      ltmInterval: parseInt(ltmInterval),
      scheduledDate: new Date(ltmScheduledDate).toISOString(),
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create job');
        }

        toast.success('สร้างงาน Long-term สำเร็จ', { description: `สร้างงานตรวจบำรุงรักษาระยะยาว ${ltmInterval} วัน เรียบร้อยแล้ว` });
        setIsLtmOpen(false);
        setLtmScheduledDate('');
        window.location.reload();
        return;
      } else {
        const mockNewJob = {
          id: `mock-ltm-${Date.now()}`,
          jobNumber: `JO-LTM-20260609-${Math.floor(1000 + Math.random() * 9000)}`,
          pdiType: 'LONG_TERM',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          scheduledDate: payload.scheduledDate,
          ltmInterval: payload.ltmInterval,
          inspector: null,
          approver: null,
        };
        setVehicle({
          ...vehicle,
          pdiJobs: [mockNewJob, ...vehicle.pdiJobs],
        });
      }

      toast.success('สร้างงาน Long-term สำเร็จ', { description: `สร้างงานตรวจบำรุงรักษาระยะยาว ${ltmInterval} วัน เรียบร้อยแล้ว` });
      setIsLtmOpen(false);
      setLtmScheduledDate('');
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual Pre-delivery Job Submit
  const handleTriggerPd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeliveryDate || !customerName || !customerPhone || !salesName || !salesPhone) {
      toast.warning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setLoading(true);
    const payload = {
      pdiType: 'PRE_DELIVERY',
      vehicleVin: vin,
      targetDeliveryDate: new Date(targetDeliveryDate).toISOString(),
      salesName: salesName.trim(),
      salesPhone: salesPhone.trim(),
      salesBranch: salesBranch || null,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create job');
        }

        toast.success('สร้างงาน Pre-delivery สำเร็จ', { description: 'สร้างงานตรวจเตรียมส่งมอบลูกค้าเรียบร้อยแล้ว' });
        setIsPdOpen(false);
        setTargetDeliveryDate('');
        setSalesName('');
        setSalesPhone('');
        setSalesBranch('');
        setCustomerName('');
        setCustomerPhone('');
        window.location.reload();
        return;
      } else {
        const mockNewJob = {
          id: `mock-pd-${Date.now()}`,
          jobNumber: `JO-PD-20260609-${Math.floor(1000 + Math.random() * 9000)}`,
          pdiType: 'PRE_DELIVERY',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          targetDeliveryDate: payload.targetDeliveryDate,
          salesName: payload.salesName,
          salesPhone: payload.salesPhone,
          salesBranch: payload.salesBranch,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          inspector: null,
          approver: null,
        };
        setVehicle({
          ...vehicle,
          pdiJobs: [mockNewJob, ...vehicle.pdiJobs],
        });
      }

      toast.success('สร้างงาน Pre-delivery สำเร็จ', { description: 'สร้างงานตรวจเตรียมส่งมอบลูกค้าเรียบร้อยแล้ว' });
      setIsPdOpen(false);
      setTargetDeliveryDate('');
      setSalesName('');
      setSalesPhone('');
      setSalesBranch('');
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: any) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit Vehicle Details Submit
  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVin.trim()) {
      toast.warning('กรุณากรอกเลขตัวถัง');
      return;
    }

    setEditLoading(true);

    const payload = {
      vin: editVin.trim().toUpperCase(),
      modelCode: editModelCode,
      colorName: editColorName,
      exteriorColor: editExteriorColor,
      interiorColor: editInteriorColor,
      productionYear: parseInt(editProductionYear),
      wsDate: editWsDate ? new Date(editWsDate).toISOString() : null,
      motorBatteryNumber: editMotorBatteryNumber,
      warehouse: editWarehouse,
      floorplan: editFloorplan,
      branchId: editBranchId,
    };

    try {
      if (isDbConnected) {
        const res = await fetch(`/api/vehicles/${vin}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update vehicle details');
        }

        const updatedVeh = await res.json();
        setVehicle(updatedVeh);
        toast.success('บันทึกการแก้ไขข้อมูลรถยนต์สำเร็จ');
        setIsEditOpen(false);
        router.refresh();
      } else {
        const mockChangeLog = {
          id: `mock-log-${Date.now()}`,
          vehicleVin: editVin.trim().toUpperCase(),
          editedBy: 'สมชาย ช่างตรวจ (Mock User)',
          changeDetails: `แก้ไขข้อมูลรถยนต์ด้วยระบบจำลอง (Mock)`,
          createdAt: new Date().toISOString(),
        };

        const foundBranch = dbBranches.find((b) => b.id === editBranchId);

        setVehicle({
          ...vehicle,
          ...payload,
          branch: foundBranch || null,
          editLogs: [mockChangeLog, ...(vehicle.editLogs || [])],
        });
        toast.success('[Mock Mode] บันทึกการแก้ไขข้อมูลรถยนต์สำเร็จ');
        setIsEditOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`ไม่สามารถบันทึกข้อมูลได้: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  return {
    vehicle,
    loading,
    isLtmOpen,
    setIsLtmOpen,
    ltmInterval,
    setLtmInterval,
    ltmScheduledDate,
    setLtmScheduledDate,
    isPdOpen,
    setIsPdOpen,
    targetDeliveryDate,
    setTargetDeliveryDate,
    salesName,
    setSalesName,
    salesPhone,
    setSalesPhone,
    salesBranch,
    setSalesBranch,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    isEditOpen,
    setIsEditOpen,
    editVin,
    setEditVin,
    editModelCode,
    setEditModelCode,
    editColorName,
    setEditColorName,
    editExteriorColor,
    setEditExteriorColor,
    editInteriorColor,
    setEditInteriorColor,
    editProductionYear,
    setEditProductionYear,
    editWsDate,
    setEditWsDate,
    editMotorBatteryNumber,
    setEditMotorBatteryNumber,
    editWarehouse,
    setEditWarehouse,
    editFloorplan,
    setEditFloorplan,
    editBranchId,
    setEditBranchId,
    editLoading,
    previewImageUrl,
    setPreviewImageUrl,
    handleTriggerLtm,
    handleTriggerPd,
    handleEditVehicle,
  };
}
