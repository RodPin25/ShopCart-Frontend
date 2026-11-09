import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Componente obligatorio según RF y estándares técnicos para consultas que retornan 0 registros.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="w-full rounded-2xl border border-dashed border-slate-300 dark:border-[#1E2D4A] bg-slate-50/50 dark:bg-[#0F1829]/60 p-10 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#E31E24]/10 text-[#E31E24] flex items-center justify-center">
        {icon ?? <PackageOpen className="w-7 h-7" />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-extrabold text-[#0A2259] dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
