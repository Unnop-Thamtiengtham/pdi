import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-card-border bg-slate-900/50 px-3 py-2 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
