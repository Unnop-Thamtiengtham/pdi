'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Car,
  Clock,
  Calendar,
  UserCheck,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      label: 'ภาพรวม (Dashboard)',
      href: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SUPERVISOR', 'BRANCH_MANAGER', 'INSPECTOR', 'WAREHOUSE'],
    },
    {
      label: 'สต็อกรถ (Vehicles)',
      href: '/vehicles',
      icon: Car,
      roles: ['ADMIN', 'SUPERVISOR', 'BRANCH_MANAGER', 'INSPECTOR', 'WAREHOUSE'],
    },
    {
      label: 'Incoming PDI',
      href: '/pdi/incoming',
      icon: Clock,
      roles: ['ADMIN', 'SUPERVISOR', 'BRANCH_MANAGER', 'INSPECTOR', 'WAREHOUSE'],
    },
    {
      label: 'Long-term Maintenance',
      href: '/pdi/longterm',
      icon: Calendar,
      roles: ['ADMIN', 'SUPERVISOR', 'BRANCH_MANAGER', 'INSPECTOR'],
    },
    {
      label: 'Pre-delivery PDI',
      href: '/pdi/predelivery',
      icon: UserCheck,
      roles: ['ADMIN', 'SUPERVISOR', 'BRANCH_MANAGER', 'INSPECTOR'],
    },
    {
      label: 'รายงาน PDI (Reports)',
      href: '/reports',
      icon: FileText,
      roles: ['ADMIN', 'SUPERVISOR', 'BRANCH_MANAGER'],
    },
  ];

  // Filter items by user role if authenticated
  const userRole = session?.user?.role || 'INSPECTOR';
  const filteredNavItems = navItems.filter((item) => {
    if (userRole === 'SUPER_ADMIN') return true;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside className={cn(
        "w-[var(--sidebar-width)] h-screen border-r border-slate-800/80 bg-[#0B0F19] flex flex-col fixed left-0 top-0 z-40 no-print transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <svg className="w-9 h-9 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M12 3.5a8.5 8.5 0 1 1-5 15.3M12 20.5a8.5 8.5 0 0 1-5-1.6"
                stroke="#5F6368"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M8.5 15L12 9l3.5 6"
                stroke="#30C0D0"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <span className="text-xs font-black tracking-widest text-[#30C0D0] uppercase">GOLD</span>
              <h1 className="text-sm font-bold tracking-wider text-slate-300 -mt-1">INTEGRATE</h1>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md lg:hidden focus:outline-none"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase pl-2">
            ระบบหลัก
          </span>
          <div className="space-y-1 mt-2">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group border border-transparent',
                    isActive
                      ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal glow-active'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-brand-teal' : 'text-slate-500 group-hover:text-white')} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={cn('w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity', isActive ? 'opacity-100 text-brand-teal' : 'text-slate-500')} />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info & Footer */}
        <div className="p-4 border-t border-slate-800/40 bg-[#070A11]/60">
          {session?.user && (
            <div className="mb-4 pl-1">
              <p className="text-xs font-semibold text-white truncate">{session.user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-brand-teal" />
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  {session.user.role}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1 font-mono">{session.user.branchName || 'มีนบุรี'}</p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full gap-2 border-slate-800 text-slate-400 hover:text-error hover:border-error/30 h-9 transition-colors text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
