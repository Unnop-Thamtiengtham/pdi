import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-brand-teal/50',
          {
            // Variants
            'bg-brand-teal text-[#080C14] hover:bg-[#22B4C4] font-semibold shadow-md shadow-brand-teal/20': variant === 'primary',
            'bg-card-bg border border-card-border text-foreground hover:bg-slate-100/80': variant === 'secondary',
            'border border-brand-teal text-brand-teal bg-transparent hover:bg-brand-teal/10': variant === 'outline',
            'text-foreground bg-transparent hover:bg-slate-100': variant === 'ghost',
            'bg-error text-white hover:bg-red-600': variant === 'danger',
            
            // Sizes
            'text-xs px-3 py-1.5': size === 'sm',
            'text-sm px-4 py-2': size === 'md',
            'text-base px-5 py-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
