import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

/**
 * Icono SVG de Rinoceronte fiel al diseño del PDF ("Don Rino" -> "Shop Cart"),
 * con el detalle del cuerno en rojo carmesí (#E31E24).
 */
export function RhinoMark({ className = 'w-9 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cuerpo y silueta del rinoceronte en postura de embestida */}
      <path
        d="M8 26C8 17 15 12 25 12H39C43 12 46 14 49 16L52 13L53 17L59 15L56 23C55 26 52 28 48 28H43L42 35H36L37 28H22L20 35H14L15 27C11 27 8 28 6 30L8 26Z"
        className="fill-[#0A2259] dark:fill-white transition-colors"
      />
      {/* Acento rojo carmesí en el cuerno frontal (identidad del PDF) */}
      <path d="M54 14L61 11L58 19L54 14Z" fill="#E31E24" />
    </svg>
  );
}

/**
 * Logotipo oficial de "Shop Cart" con el isotipo del rinoceronte del PDF.
 */
export function BrandLogo({
  size = 'md',
  showText = true,
  subtitle,
  className,
  ...props
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-5',
    md: 'w-10 h-6',
    lg: 'w-12 h-8',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={clsx('inline-flex items-center gap-2.5 select-none', className)} {...props}>
      <RhinoMark className={iconSizes[size]} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={clsx(
              'font-extrabold tracking-tight text-[#0A2259] dark:text-white transition-colors',
              textSizes[size],
            )}
          >
            Shop Cart
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E31E24] mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ilustración vectorial de alto impacto para el Hero Banner (fiel a las páginas 1, 2 y 3 del PDF):
 * Rinoceronte geométrico sobre rampa roja con badge flotante de carrito de compras.
 */
export function RhinoHeroIllustration({ className }: { className?: string }) {
  return (
    <div className={clsx('relative w-full max-w-[500px] mx-auto select-none', className)}>
      {/* Resplandor circular de fondo (Azul claro en Light Mode, Azul Marino profundo en Dark Mode) */}
      <div
        className="absolute inset-4 rounded-full bg-sky-200/75 dark:bg-[#132956]/80 blur-md transition-colors"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 520 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-auto drop-shadow-xl"
        role="img"
        aria-label="Ilustración Shop Cart con fuerza de rinoceronte"
      >
        {/* Sombra de fondo circular */}
        <ellipse
          cx="285"
          cy="175"
          rx="185"
          ry="125"
          className="fill-[#B9DDFB]/70 dark:fill-[#11244D]/85 transition-colors"
        />

        {/* Piernas traseras / delanteras en tono gris más oscuro para profundidad */}
        <path d="M150 205L142 260H185L195 210H150Z" fill="#7D8087" />
        <path d="M312 205L302 262H348L360 205H312Z" fill="#7D8087" />

        {/* Cuerpo principal del rinoceronte geométrico */}
        <path
          d="M115 175C115 118 165 88 245 88H355C385 88 412 102 428 124L445 190C430 212 396 220 355 215H180L158 258H115L115 175Z"
          fill="#94979E"
        />

        {/* Pierna delantera principal */}
        <path d="M290 190L282 260H332L346 195H290Z" fill="#888B92" />

        {/* Cabeza y hocico del rinoceronte */}
        <path
          d="M375 102L412 85L422 108L456 118L492 112L474 162C462 184 436 196 405 192L372 175L375 102Z"
          fill="#94979E"
        />

        {/* Orejas */}
        <path d="M392 98L406 78L418 96L392 98Z" fill="#7D8087" />

        {/* Cuerno principal y secundario */}
        <path d="M442 118L455 96L466 121L442 118Z" fill="#D4D7DD" />
        <path d="M465 121L496 108L482 146L465 121Z" fill="#C4C8D0" />

        {/* Ojo */}
        <circle cx="426" cy="146" r="3.5" fill="#1E293B" />

        {/* Cola */}
        <path
          d="M116 155C102 172 100 198 106 218"
          stroke="#7D8087"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Rampa roja inferior (firma visual del PDF) */}
        <path d="M110 260C220 254 345 260 445 272L442 308C335 284 218 274 118 272L110 260Z" fill="#E61E25" />

        {/* Tarjeta flotante blanca con icono de carrito */}
        <g transform="translate(425, 212)">
          <rect width="58" height="54" rx="14" fill="#FFFFFF" />
          <path
            d="M16 17H21L24.5 31H39L42 21H22.5"
            stroke="#64748B"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="36" r="2.5" fill="#475569" />
          <circle cx="37" cy="36" r="2.5" fill="#475569" />
        </g>
      </svg>
    </div>
  );
}
