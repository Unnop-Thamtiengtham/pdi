import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseRepairsProps {
  initialJobs: any[];
  isDbConnected: boolean;
  dbBranches: any[];
  session: any;
}

export function useRepairs({ initialJobs, isDbConnected, dbBranches, session }: UseRepairsProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);

  // Dialog states for Send to Repair
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repairDate, setRepairDate] = useState('');
  const [repairLocation, setRepairLocation] = useState(dbBranches[0]?.name || '');
  const [customLocation, setCustomLocation] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirmation states for complete repair
  const [confirmJob, setConfirmJob] = useState<any | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [repairPhotos, setRepairPhotos] = useState<Record<string, string[]>>({});
  const [photoUploading, setPhotoUploading] = useState<Record<string, boolean>>({});

  // Print state
  const [printJob, setPrintJob] = useState<any | null>(null);

  // Fallback mock data when DB is not connected
  const getMockJobs = () => {
    return [
      {
        id: 'mock-repair-1',
        jobNumber: 'JO-INC-20260626-7875',
        pdiType: 'INCOMING',
        status: 'DEFECT_FOUND',
        vehicleVin: 'LNAT4AB34T5G05303',
        vehicle: { modelName: 'AION UT', colorName: 'Midnight Black', branch: { name: 'มีนบุรี' } },
        inspector: { name: 'สมชาย ช่างตรวจ' },
        defects: [
          { id: 'd1', defectNo: 1, description: 'กระจกมองข้างซ้ายมีรอยขีดข่วน', status: 'OPEN' }
        ],
        updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        sentToRepairAt: null,
        repairLocation: null,
        repairNotes: null,
      },
      {
        id: 'mock-repair-2',
        jobNumber: 'JO-INC-20260626-7707',
        pdiType: 'INCOMING',
        status: 'REJECTED',
        vehicleVin: 'LNAT4AB34T5G05304',
        vehicle: { modelName: 'HYPTEC HT', colorName: 'Rose Gold', branch: { name: 'มีนบุรี' } },
        inspector: { name: 'วิชัย ช่างตรวจ' },
        defects: [
          { id: 'd2', defectNo: 1, description: 'แรงดันลมยางสูงเกินเกณฑ์', status: 'OPEN' },
          { id: 'd3', defectNo: 2, description: 'มีเสียงดังขณะพับเบาะหลัง', status: 'OPEN' }
        ],
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentToRepairAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        repairLocation: 'ฝ่ายเทคนิค/ช่างเครื่องยนต์ (Mechanic/Technical)',
        repairNotes: 'เช็คแรงดันลมยางกับกลไกพับเบาะ',
      },
    ];
  };

  useEffect(() => {
    setJobs(isDbConnected ? initialJobs : getMockJobs());
  }, [initialJobs, isDbConnected]);

  // Handle printing
  useEffect(() => {
    if (printJob) {
      const timer = setTimeout(() => {
        window.print();
        setPrintJob(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printJob]);

  // Filter jobs based on search term
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      job.jobNumber.toLowerCase().includes(term) ||
      job.vehicleVin.toLowerCase().includes(term) ||
      (job.vehicle?.modelName && job.vehicle.modelName.toLowerCase().includes(term)) ||
      (job.inspector?.name && job.inspector.name.toLowerCase().includes(term))
    );
  });

  const handleOpenRepairModal = (job: any) => {
    setSelectedJob(job);
    
    const d = job.sentToRepairAt ? new Date(job.sentToRepairAt) : new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    
    setRepairDate(localISOTime);
    
    const defaults = [
      'อู่ตัวถังและสี (Body & Paint)',
      'ฝ่ายเทคนิค/ช่างเครื่องยนต์ (Mechanic/Technical)',
      'อู่ภายนอก (External Shop)'
    ];

    if (job.repairLocation) {
      if (defaults.includes(job.repairLocation)) {
        setRepairLocation(job.repairLocation);
        setCustomLocation('');
      } else {
        setRepairLocation('อื่น ๆ');
        setCustomLocation(job.repairLocation);
      }
    } else {
      setRepairLocation('อู่ตัวถังและสี (Body & Paint)');
      setCustomLocation('');
    }
    
    setRepairNotes(job.repairNotes || '');
    setIsModalOpen(true);
  };

  const handleSubmitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSubmitting(true);
    const finalLocation = repairLocation === 'อื่น ๆ' ? customLocation : repairLocation;
    const selectedDate = new Date(repairDate);

    const payload = {
      jobId: selectedJob.id,
      sentToRepairAt: selectedDate.toISOString(),
      repairLocation: finalLocation,
      repairNotes: repairNotes,
    };

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save repair info');
        }
        toast.success(selectedJob.sentToRepairAt ? 'อัปเดตข้อมูลส่งซ่อมสำเร็จ' : 'ดำเนินการส่งซ่อมเรียบร้อยแล้ว');
      } else {
        toast.success('[Mock Mode] บันทึกการส่งซ่อมสำเร็จ');
      }

      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          j.id === selectedJob.id
            ? {
                ...j,
                sentToRepairAt: payload.sentToRepairAt,
                repairLocation: payload.repairLocation,
                repairNotes: payload.repairNotes,
                defects: j.defects?.map((d: any) =>
                  d.status === 'OPEN' ? { ...d, status: 'IN_REPAIR' } : d
                ) || [],
              }
            : j
        )
      );

      setIsModalOpen(false);
      setSelectedJob(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ไม่สามารถบันทึกข้อมูลการส่งซ่อมได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (job: any) => {
    setPrintJob(job);
  };

  const handleCompleteRepair = (job: any) => {
    setConfirmJob(job);
    setRepairPhotos({});
    setPhotoUploading({});
    setIsConfirmOpen(true);
  };

  const handleRepairPhotoUpload = async (defectId: string, file: File) => {
    setPhotoUploading((prev) => ({ ...prev, [defectId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `repairs/${confirmJob?.id}/${defectId}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'อัปโหลดรูปไม่สำเร็จ');
      }

      const { fileUrl } = await res.json();
      setRepairPhotos((prev) => ({
        ...prev,
        [defectId]: [...(prev[defectId] || []), fileUrl],
      }));
      toast.success('อัปโหลดรูปสำเร็จ');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูป');
    } finally {
      setPhotoUploading((prev) => ({ ...prev, [defectId]: false }));
    }
  };

  const handleRemoveRepairPhoto = (defectId: string, urlToRemove: string) => {
    setRepairPhotos((prev) => ({
      ...prev,
      [defectId]: (prev[defectId] || []).filter((url) => url !== urlToRemove),
    }));
  };

  const handleConfirmComplete = async () => {
    if (!confirmJob) return;
    setConfirmSubmitting(true);

    try {
      if (isDbConnected) {
        const res = await fetch('/api/pdi-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: confirmJob.id,
            status: 'APPROVED',
            repairCompleted: true,
            approverId: session?.user?.id || undefined,
            repairPhotos: (confirmJob.defects || [])
              .filter((d: any) => d.status === 'OPEN' || d.status === 'IN_REPAIR')
              .map((d: any) => ({
                defectId: d.id,
                photoUrls: repairPhotos[d.id] || [],
              })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to complete repair');
        }
        
        toast.success('บันทึกซ่อมเสร็จสิ้น', { description: 'นำรถเข้าสต็อกเรียบร้อยแล้ว' });
      } else {
        toast.success('บันทึกซ่อมเสร็จสิ้น', { description: '[Mock Mode] นำรถเข้าสต็อกเรียบร้อยแล้ว' });
      }

      setJobs((prevJobs) => prevJobs.filter((j) => j.id !== confirmJob.id));
      router.refresh();
      setIsConfirmOpen(false);
      setConfirmJob(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredJobs,
    selectedJob,
    isModalOpen,
    setIsModalOpen,
    repairDate,
    setRepairDate,
    repairLocation,
    setRepairLocation,
    customLocation,
    setCustomLocation,
    repairNotes,
    setRepairNotes,
    submitting,
    confirmJob,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmSubmitting,
    repairPhotos,
    photoUploading,
    handleOpenRepairModal,
    handleSubmitRepair,
    handlePrint,
    handleCompleteRepair,
    handleRepairPhotoUpload,
    handleRemoveRepairPhoto,
    handleConfirmComplete,
  };
}
