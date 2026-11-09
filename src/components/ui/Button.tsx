import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'navy' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Botón reutilizable del Design System inspirado en el PDF:
 * - `primary`: Rojo vibrante (#E31E24) como el botón "Ver ofertas".
 * - `secondary`: Contorno Navy/Oscuro como el botón "Explorar todo".
 * - `navy`: Azul profundo (#0A2259) corporativo.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = true,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#E31E24] hover:bg-[#C5161B] active:bg-[#A91217] text-white shadow-sm shadow-[#E31E24]/25 border border-transparent',
      secondary:
        'bg-transparent hover:bg-[#0A2259]/5 dark:bg-[#0B111E]/80 dark:hover:bg-[#162238] text-[#0A2259] dark:text-slate-100 border-2 border-[#0A2259] dark:border-slate-700',
      navy: 'bg-[#0A2259] hover:bg-[#0F2F7A] text-white border border-transparent shadow-sm',
      ghost:
        'bg-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/70 text-[#0A2259] dark:text-slate-200 border border-transparent',
      danger:
        'bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-500/30',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3.5 py-1.5 text-xs font-semibold gap-1.5',
      md: 'px-5 py-2.5 text-sm font-bold gap-2',
      lg: 'px-7 py-3.5 text-base font-bold gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31E24] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B111E]',
            pill ? 'rounded-full' : 'rounded-xl',
            variantStyles[variant],
            sizeStyles[size],
            fullWidth && 'w-full',
            isDisabled && 'opacity-55 cursor-not-allowed pointer-events-none',
            className,
          ),
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
