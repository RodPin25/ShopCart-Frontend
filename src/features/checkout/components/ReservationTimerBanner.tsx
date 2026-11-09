import { Clock, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

export interface ReservationTimerBannerProps {
  formattedTime: string;
  progressPercentage: number;
  remainingSeconds: number;
  isReserving: boolean;
}

/**
 * Barra superior de cuenta regresiva de 15 minutos para la reserva de existencia en el Checkout (RF-06).
 */
export function ReservationTimerBanner({
  formattedTime,
  progressPercentage,
  remainingSeconds,
  isReserving,
}: ReservationTimerBannerProps) {
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 180; // Últimos 3 minutos

  return (
    <div
      className={clsx(
        'rounded-2xl border p-4 transition-colors space-y-2.5',
        isUrgent
          ? 'bg-[#E31E24]/10 border-[#E31E24]/40 text-[#A91217] dark:text-red-200'
          : 'bg-[#0A2259]/5 dark:bg-[#111927] border-[#0A2259]/20 dark:border-[#1E2D4A] text-[#0A2259] dark:text-slate-100',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              isUrgent
                ? 'bg-[#E31E24] text-white animate-pulse'
                : 'bg-[#E31E24]/15 text-[#E31E24]',
            )}
          >
            {isUrgent ? <ShieldAlert className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs sm:text-sm font-extrabold">
              {isReserving
                ? 'Reservando existencias de tu carrito...'
                : 'Existencia apartada temporalmente para tu compra'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Completa el pago antes de que finalice el contador de 15 minutos para garantizar tu stock (RF-06).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-[#1E2D4A]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tiempo restante:
          </span>
          <span
            className={clsx(
              'font-mono text-base font-extrabold',
              isUrgent ? 'text-[#E31E24]' : 'text-[#0A2259] dark:text-white',
            )}
          >
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#1E2D4A] overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all duration-500 rounded-full',
            isUrgent ? 'bg-[#E31E24]' : 'bg-emerald-500',
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
