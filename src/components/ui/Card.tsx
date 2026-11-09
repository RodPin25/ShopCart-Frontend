import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type CardAccent = 'none' | 'blue' | 'red' | 'navy' | 'white' | 'emerald';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Borde superior de acento idéntico a las tarjetas inferiores del PDF ("Envíos a todo el país", "Pago seguro", "Devoluciones fáciles").
   */
  accent?: CardAccent;
  noPadding?: boolean;
}

export function Card({
  accent = 'none',
  noPadding = false,
  className,
  children,
  ...props
}: CardProps) {
  const accentClasses: Record<CardAccent, string> = {
    none: '',
    blue: 'border-t-4 border-t-[#1D4ED8]',
    red: 'border-t-4 border-t-[#E31E24]',
    navy: 'border-t-4 border-t-[#0A2259] dark:border-t-slate-200',
    white: 'border-t-4 border-t-slate-300 dark:border-t-white',
    emerald: 'border-t-4 border-t-emerald-500',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl bg-white dark:bg-[#111927] border border-slate-200/90 dark:border-[#1E2D4A] shadow-sm transition-colors overflow-hidden',
          accentClasses[accent],
          !noPadding && 'p-5',
          className,
        ),
      )}
      {...props}
    >
      {children}
    </div>
  );
}
