import { z } from 'zod';

/**
 * Esquema Zod para validar y transformar las variables de entorno de Vite.
 * Incluye valores por defecto seguros para garantizar portabilidad inmediata
 * al clonar el repositorio en una máquina limpia (Requisito No Funcional: Portabilidad).
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .url('VITE_API_BASE_URL debe ser una URL válida (ej. http://localhost:3000/api)')
    .default('http://localhost:3000/api')
    .transform((url) => url.replace(/\/+$/, '')),
  VITE_APP_NAME: z
    .string()
    .trim()
    .min(1, 'VITE_APP_NAME no puede estar vacío')
    .default('ShopCart'),
  VITE_CURRENCY_CODE: z
    .string()
    .trim()
    .length(3, 'VITE_CURRENCY_CODE debe ser un código ISO de 3 letras (ej. GTQ)')
    .default('GTQ'),
  VITE_IVA_RATE: z.coerce
    .number()
    .positive('VITE_IVA_RATE debe ser mayor a 0')
    .max(1, 'VITE_IVA_RATE debe expresarse en decimal (ej. 0.12 para 12%)')
    .default(0.12),
  VITE_RESERVATION_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive('VITE_RESERVATION_TTL_MINUTES debe ser un entero positivo')
    .default(15),
});

export interface EnvConfig {
  readonly API_BASE_URL: string;
  readonly APP_NAME: string;
  readonly CURRENCY_CODE: string;
  readonly IVA_RATE: number;
  readonly RESERVATION_TTL_MINUTES: number;
  readonly IS_DEV: boolean;
}

function parseEnv(): EnvConfig {
  const rawEnv = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || undefined,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME || undefined,
    VITE_CURRENCY_CODE: import.meta.env.VITE_CURRENCY_CODE || undefined,
    VITE_IVA_RATE: import.meta.env.VITE_IVA_RATE || undefined,
    VITE_RESERVATION_TTL_MINUTES: import.meta.env.VITE_RESERVATION_TTL_MINUTES || undefined,
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    console.error(
      '[ShopCart Config] Error en variables de entorno, aplicando valores por defecto:',
      parsed.error.flatten().fieldErrors
    );
    return {
      API_BASE_URL: 'http://localhost:3000/api',
      APP_NAME: 'ShopCart',
      CURRENCY_CODE: 'GTQ',
      IVA_RATE: 0.12,
      RESERVATION_TTL_MINUTES: 15,
      IS_DEV: Boolean(import.meta.env.DEV),
    };
  }

  return {
    API_BASE_URL: parsed.data.VITE_API_BASE_URL,
    APP_NAME: parsed.data.VITE_APP_NAME,
    CURRENCY_CODE: parsed.data.VITE_CURRENCY_CODE,
    IVA_RATE: parsed.data.VITE_IVA_RATE,
    RESERVATION_TTL_MINUTES: parsed.data.VITE_RESERVATION_TTL_MINUTES,
    IS_DEV: Boolean(import.meta.env.DEV),
  };
}

export const ENV: EnvConfig = parseEnv();
