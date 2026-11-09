import { useCallback, useEffect, useRef, useState } from 'react';
import { ENV } from '../config/env';

export interface UseCountdownOptions {
  /**
   * Fecha/hora de expiración ISO o timestamp en ms.
   * Si es `null` o `undefined`, el contador permanece inactivo.
   */
  expiresAt: string | number | Date | null | undefined;
  /**
   * Duración total de referencia en minutos para calcular el porcentaje de progreso (por defecto 15 min según RF-06).
   */
  totalDurationMinutes?: number;
  /**
   * Callback disparado exactamente una vez cuando la cuenta regresiva llega a 0.
   */
  onExpire?: () => void;
}

export interface UseCountdownReturn {
  remainingSeconds: number;
  minutes: number;
  seconds: number;
  /** Formato `MM:SS` listo para mostrar en la barra de reserva del Checkout (RF-06) */
  formattedTime: string;
  isActive: boolean;
  isExpired: boolean;
  /** Porcentaje restante de 0 a 100 */
  progressPercentage: number;
  /** Reinicia o establece manualmente un nuevo tiempo de expiración */
  resetWithMinutes: (minutes?: number) => string;
}

function getTargetTimestamp(target: string | number | Date | null | undefined): number | null {
  if (!target) return null;
  if (typeof target === 'number') return target;
  if (target instanceof Date) return target.getTime();
  const parsed = Date.parse(target);
  return Number.isNaN(parsed) ? null : parsed;
}

function computeRemainingSeconds(targetMs: number | null, nowMs: number): number {
  if (targetMs === null) return 0;
  const diffMs = targetMs - nowMs;
  return Math.max(0, Math.ceil(diffMs / 1000));
}

/**
 * Hook de cuenta regresiva en tiempo real para la reserva temporal de inventario (15 minutos en RF-06).
 */
export function useCountdown({
  expiresAt,
  totalDurationMinutes = ENV.RESERVATION_TTL_MINUTES,
  onExpire,
}: UseCountdownOptions): UseCountdownReturn {
  const targetMs = getTargetTimestamp(expiresAt);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const hasFiredExpireRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    hasFiredExpireRef.current = false;

    if (targetMs === null) {
      return;
    }

    const initialRemaining = computeRemainingSeconds(targetMs, Date.now());
    if (initialRemaining <= 0) {
      hasFiredExpireRef.current = true;
      onExpireRef.current?.();
      return;
    }

    const intervalId = window.setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);

      const nextRemaining = computeRemainingSeconds(targetMs, currentNow);
      if (nextRemaining <= 0 && !hasFiredExpireRef.current) {
        hasFiredExpireRef.current = true;
        window.clearInterval(intervalId);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetMs]);

  const remainingSeconds = computeRemainingSeconds(targetMs, nowMs);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = Math.max(1, totalDurationMinutes * 60);
  const progressPercentage = Math.min(100, Math.max(0, (remainingSeconds / totalSeconds) * 100));

  const resetWithMinutes = useCallback(
    (customMinutes = totalDurationMinutes): string => {
      const nextDate = new Date(Date.now() + customMinutes * 60 * 1000);
      return nextDate.toISOString();
    },
    [totalDurationMinutes],
  );

  return {
    remainingSeconds,
    minutes,
    seconds,
    formattedTime,
    isActive: targetMs !== null && remainingSeconds > 0,
    isExpired: targetMs !== null && remainingSeconds <= 0,
    progressPercentage,
    resetWithMinutes,
  };
}
