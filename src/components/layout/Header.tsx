'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Bell, MapPin, ShieldAlert, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20 w-full no-print">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-brand-teal/10 border border-brand-teal/20 px-2 py-1 rounded text-[10px] text-brand-teal font-semibold font-mono tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-brand-teal/20" />
          <span>EV PORTAL</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-800 hidden md:block">
          {process.env.NEXT_PUBLIC_APP_NAME || 'PDI Management System'}
        </h2>
      </div>

      {/* Stats and User Quick Profile */}
      <div className="flex items-center gap-6">
        {/* Branch Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <MapPin className="w-4 h-4 text-brand-teal" />
          <span>สาขา: {session?.user?.branchName || 'มีนบุรี'}</span>
        </div>

        {/* Notifications and Alerts */}
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          <div className="relative cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 bg-brand-teal text-slate-900 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono">
              3
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-brand-teal font-mono">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block">
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
