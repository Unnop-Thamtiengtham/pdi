'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Bell, MapPin, ShieldAlert, Zap, Menu, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getPdiRouteSlug } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentJobs, setUrgentJobs] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside (non-blocking)
  useEffect(() => {
    if (!showDropdown) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDropdown]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        // Fetch PDI jobs to extract pending/in progress SLA jobs
        const res = await fetch('/api/pdi-jobs');
        if (res.ok) {
          const jobs = await res.json();
          // Filter incoming jobs that are PENDING or IN_PROGRESS (unresolved SLA)
          const unresolved = jobs.filter((j: any) => {
            if (j.pdiType !== 'INCOMING') return false;
            return j.status === 'PENDING' || j.status === 'IN_PROGRESS';
          });
          setUrgentJobs(unresolved);
          setUnreadCount(unresolved.length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }
    
    fetchNotifications();

    // Listen to custom event for immediate refresh
    const handleJobUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('pdi-job-updated', handleJobUpdate);

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('pdi-job-updated', handleJobUpdate);
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 w-full no-print">
      {/* Title */}
      <div className="flex items-center gap-2 md:gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-800 rounded-md lg:hidden focus:outline-none"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-1 bg-brand-teal/10 border border-brand-teal/20 px-2 py-1 rounded text-[10px] text-brand-teal font-semibold font-mono tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-brand-teal/20" />
          <span>EV PORTAL</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-800 hidden lg:block">
          {process.env.NEXT_PUBLIC_APP_NAME || 'PDI Management System'}
        </h2>
      </div>

      {/* Stats and User Quick Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Branch Indicator */}
        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
          <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-teal" />
          <span className="hidden sm:inline">สาขา: {session?.user?.branchName || 'มีนบุรี'}</span>
          <span className="sm:hidden text-[11px]">{session?.user?.branchName || 'มีนบุรี'}</span>
        </div>

        {/* Notifications and Alerts */}
        <div className="flex items-center gap-3 md:gap-4 border-l border-slate-200 pl-3 md:pl-6">
          <div className="relative">
            <button 
              ref={bellButtonRef}
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative cursor-pointer text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-100 flex items-center justify-center focus:outline-none"
              aria-label="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-teal text-slate-900 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Popover */}
            {showDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden divide-y divide-slate-100 transform origin-top-right transition-all"
              >
                <div className="p-3 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-brand-teal" />
                    <span>การแจ้งเตือนงานด่วน ({unreadCount})</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-error/15 text-error font-semibold px-2 py-0.5 rounded-full animate-pulse">
                      ใกล้ครบ SLA
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {urgentJobs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ไม่มีงานตรวจด่วนในขณะนี้
                    </div>
                  ) : (
                    urgentJobs.map((job) => (
                      <Link 
                        key={job.id} 
                        href={`/pdi/${getPdiRouteSlug(job.pdiType)}/${job.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="p-3 block hover:bg-slate-50/80 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-slate-800">
                              {job.vehicle?.modelName || 'รถยนต์ไฟฟ้า'}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">
                              VIN: {job.vehicleVin}
                            </p>
                          </div>
                          <span className="text-[9px] font-semibold bg-warning/10 text-warning border border-warning/20 px-1.5 py-0.5 rounded-md uppercase font-mono">
                            {job.status === 'PENDING' ? 'รอตรวจ' : 'กำลังตรวจ'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[9px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-brand-teal" />
                            <span>SLA 24 ชั่วโมง</span>
                          </span>
                          <span className="text-brand-teal font-semibold flex items-center gap-0.5 hover:underline">
                            <span>เริ่มตรวจ</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-2 text-center bg-slate-50">
                  <Link 
                    href="/pdi/incoming" 
                    onClick={() => setShowDropdown(false)}
                    className="text-[10px] font-semibold text-brand-teal hover:underline block"
                  >
                    ดูงานตรวจ Incoming ทั้งหมด
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-brand-teal font-mono">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{session?.user?.name}</p>
              <span className="text-[10px] text-slate-500 font-medium font-mono">
                {session?.user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
