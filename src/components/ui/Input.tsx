import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  pill?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      pill = false,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold uppercase tracking-wider text-[#0A2259] dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full bg-white dark:bg-[#0F1829] text-[#0A2259] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm px-4 py-2.5 border transition-colors focus:outline-none focus:ring-2',
                pill ? 'rounded-full' : 'rounded-xl',
                leftIcon && 'pl-10',
                rightElement && 'pr-11',
                error
                  ? 'border-[#E31E24] focus:border-[#E31E24] focus:ring-[#E31E24]/25'
                  : 'border-slate-300 dark:border-[#1E2D4A] focus:border-[#0A2259] dark:focus:border-[#E31E24] focus:ring-[#0A2259]/15 dark:focus:ring-[#E31E24]/20',
                props.disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900',
                className,
              ),
            )}
            {...props}
          />

          {rightElement && <div className="absolute right-2.5 flex items-center">{rightElement}</div>}
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

Input.displayName = 'Input';
