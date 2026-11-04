'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

interface ParsedOption {
  value: string;
  label: React.ReactNode;
  textLabel: string;
  disabled?: boolean;
}

function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      const fragProps = child.props as { children?: React.ReactNode };
      options.push(...parseOptions(fragProps.children));
      return;
    }

    if (child.type === 'option') {
      const optProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      const textLabel = extractText(optProps.children);
      const val = optProps.value !== undefined ? String(optProps.value) : textLabel;
      options.push({
        value: val,
        label: optProps.children,
        textLabel,
        disabled: optProps.disabled,
      });
    }
  });

  return options;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, required, name, id, ...props }, ref) => {
    const options = React.useMemo(() => parseOptions(children), [children]);

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return options[0]?.value ?? '';
    });

    const currentValue = isControlled ? String(value) : internalValue;
    const selectedOption = options.find((opt) => opt.value === currentValue) || options[0];

    const [open, setOpen] = React.useState(false);
    const [openUpward, setOpenUpward] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
      if (disabled) return;
      if (!open && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedHeight = Math.min(options.length * 36 + 16, 250);
        setOpenUpward(spaceBelow < estimatedHeight && rect.top > spaceBelow);
      }
      setOpen((prev) => !prev);
    };

    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (containerRef.current && !containerRef.current.contains(target)) {
          setOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open]);

    const handleSelect = (optValue: string) => {
      if (!isControlled) {
        setInternalValue(optValue);
      }
      if (onChange) {
        const syntheticEvent = {
          target: { value: optValue, name: name || '', id: id || '' },
          currentTarget: { value: optValue, name: name || '', id: id || '' },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      setOpen(false);
      triggerRef.current?.focus();
    };

    const isPlaceholder = selectedOption && selectedOption.value === '' && options.length > 1;

    return (
      <div ref={containerRef} className="relative w-full">
        {/* Hidden native select for form validation & ref compatibility */}
        <select
          ref={ref}
          id={id ? `${id}-native` : undefined}
          name={name}
          value={currentValue}
          onChange={() => {}}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {children}
        </select>

        {/* Custom Styled Trigger Button */}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={handleToggle}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-2xs transition-all duration-150 cursor-pointer select-none text-left',
            'hover:border-slate-300 hover:bg-slate-50/40',
            'focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20',
            open && 'border-brand-teal ring-2 ring-brand-teal/20 bg-white',
            disabled && 'cursor-not-allowed bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-50',
            isPlaceholder && 'text-slate-400',
            className
          )}
        >
          <span className="truncate flex-1 font-medium">
            {selectedOption ? selectedOption.label : ''}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
              open && 'rotate-180 text-brand-teal'
            )}
          />
        </button>

        {/* Custom Floating Dropdown Menu (inline inside DOM tree so Radix Dialog allows scrolling) */}
        {open && (
          <div
            role="listbox"
            className={cn(
              'absolute left-0 z-[9999] min-w-full w-max max-w-[min(90vw,360px)] rounded-xl border border-slate-200/90 bg-white p-1.5 text-slate-800 shadow-xl shadow-slate-900/10 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150',
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            )}
          >
            <div className="max-h-56 overflow-y-auto overscroll-contain space-y-0.5 pr-0.5">
              {options.map((opt, idx) => {
                const isSelected = opt.value === currentValue;
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={cn(
                      'relative flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer select-none',
                      isSelected
                        ? 'bg-brand-teal/12 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900',
                      opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-teal-600 stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
