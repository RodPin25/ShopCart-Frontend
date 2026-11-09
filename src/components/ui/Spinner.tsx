import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div
      className={clsx('inline-flex flex-col items-center justify-center gap-2.5', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={clsx('animate-spin text-[#E31E24]', sizeClasses[size])} />
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      )}
    </div>
  );
}

export function PageLoader({ label = 'Cargando información...' }: { label?: string }) {
  return (
    <div className="w-full min-h-[280px] flex items-center justify-center py-12">
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-xl bg-slate-200/80 dark:bg-[#18243A]',
        className,
      )}
      aria-hidden="true"
    />
  );
}
