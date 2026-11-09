import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Componente obligatorio según estándares de calidad (sección 5 de agent.md):
 * Mensaje de error amigable con botón de reintento (`isError` / `refetch`).
 */
export function ErrorState({
  title = 'No pudimos cargar la información',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="w-full rounded-2xl border border-[#E31E24]/30 bg-[#E31E24]/5 dark:bg-[#1A1320] p-8 text-center flex flex-col items-center justify-center gap-3"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#E31E24]/15 text-[#E31E24] flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-extrabold text-[#0A2259] dark:text-white">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </div>
      {onRetry && (
        <div className="mt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
