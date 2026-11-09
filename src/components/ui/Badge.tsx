import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'red' | 'navy' | 'blue' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    red: 'bg-[#E31E24]/15 text-[#E31E24] border-[#E31E24]/30 dark:bg-[#E31E24]/20 dark:text-red-300',
    navy: 'bg-[#0A2259]/10 text-[#0A2259] border-[#0A2259]/25 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800/50',
    blue: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300',
    success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
    danger: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300',
    neutral:
      'bg-slate-200/70 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide',
          variantClasses[variant],
          className,
        ),
      )}
      {...props}
    >
      {children}
    </span>
  );
}
