import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { clsx } from 'clsx';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const variantStyles: Record<AlertVariant, { container: string; icon: ReactNode }> = {
    info: {
      container:
        'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    },
    success: {
      container:
        'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    },
    warning: {
      container:
        'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200',
      icon: <TriangleAlert className="w-5 h-5 text-amber-500 shrink-0" />,
    },
    error: {
      container:
        'bg-[#E31E24]/10 border-[#E31E24]/35 text-[#A91217] dark:text-red-200',
      icon: <AlertCircle className="w-5 h-5 text-[#E31E24] shrink-0" />,
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        current.container,
        className,
      )}
    >
      {current.icon}
      <div className="flex-1 space-y-0.5">
        {title && <p className="font-bold">{title}</p>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
