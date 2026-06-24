import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-slate-100 text-slate-700 border border-slate-200': variant === 'default',
          'bg-success/10 text-success border border-success/30': variant === 'success',
          'bg-warning/10 text-warning border border-warning/30': variant === 'warning',
          'bg-danger/10 text-danger border border-danger/30': variant === 'danger',
          'bg-info/10 text-info border border-info/30': variant === 'info',
          'border border-slate-200 text-slate-600': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
