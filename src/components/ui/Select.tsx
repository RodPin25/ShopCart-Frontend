import { forwardRef, type SelectHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold uppercase tracking-wider text-[#0A2259] dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={twMerge(
              clsx(
                'w-full appearance-none bg-white dark:bg-[#0F1829] text-[#0A2259] dark:text-slate-100 text-sm px-4 py-2.5 pr-10 rounded-xl border transition-colors focus:outline-none focus:ring-2 cursor-pointer',
                error
                  ? 'border-[#E31E24] focus:border-[#E31E24] focus:ring-[#E31E24]/25'
                  : 'border-slate-300 dark:border-[#1E2D4A] focus:border-[#0A2259] dark:focus:border-[#E31E24] focus:ring-[#0A2259]/15 dark:focus:ring-[#E31E24]/20',
                props.disabled && 'opacity-60 cursor-not-allowed',
                className,
              ),
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={String(option.value)} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {error ? (
          <p className="text-xs font-medium text-[#E31E24]" role="alert">
            {error}
          </p>
        ) : (
          helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
