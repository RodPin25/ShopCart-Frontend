/**
 * Configuración tipada de variables de entorno.
 * Incluye valores por defecto seguros para garantizar portabilidad inmediata
 * al clonar el repositorio en una máquina limpia.
 */
export interface EnvConfig {
  readonly API_BASE_URL: string;
  readonly APP_NAME: string;
  readonly CURRENCY_CODE: string;
  readonly IVA_RATE: number;
  readonly RESERVATION_TTL_MINUTES: number;
  readonly IS_DEV: boolean;
}

const rawApiUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const rawAppName = (import.meta.env.VITE_APP_NAME as string | undefined)?.trim();
const rawCurrency = (import.meta.env.VITE_CURRENCY_CODE as string | undefined)?.trim();
const rawIvaRate = Number(import.meta.env.VITE_IVA_RATE);
const rawReservationTtl = Number(import.meta.env.VITE_RESERVATION_TTL_MINUTES);

export const ENV: EnvConfig = {
  API_BASE_URL: rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl.replace(/\/+$/, '') : 'http://localhost:3000/api',
  APP_NAME: rawAppName && rawAppName.length > 0 ? rawAppName : 'ShopCart',
  CURRENCY_CODE: rawCurrency && rawCurrency.length > 0 ? rawCurrency : 'GTQ',
  IVA_RATE: !Number.isNaN(rawIvaRate) && rawIvaRate > 0 ? rawIvaRate : 0.12,
  RESERVATION_TTL_MINUTES: !Number.isNaN(rawReservationTtl) && rawReservationTtl > 0 ? rawReservationTtl : 15,
  IS_DEV: import.meta.env.DEV,
};
