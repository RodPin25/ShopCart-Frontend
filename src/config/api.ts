import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ENV } from './env';
import {
  API_ENDPOINTS,
  AUTH_EVENTS,
  HTTP_HEADERS,
  STORAGE_KEYS,
  generateUniqueKey,
} from './constants';

/**
 * Estructura estándar de respuesta exitosa de la API ShopCart.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Estructura estándar de error devuelta por el backend:
 * { success: false, error: { code: "ERR_...", message: "..." } }
 */
export interface ApiErrorPayload {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

/**
 * Extensión interna de la configuración de Axios para evitar bucles infinitos de reintento.
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Obtiene o inicializa el token de sesión para el carrito de invitado (RF-04).
 */
export function getOrCreateGuestToken(): string {
  let guestToken = localStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
  if (!guestToken) {
    guestToken = generateUniqueKey('guest');
    localStorage.setItem(STORAGE_KEYS.GUEST_TOKEN, guestToken);
  }
  return guestToken;
}

/**
 * Helpers para administrar los tokens JWT en almacenamiento local.
 */
export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: (): string | null => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    window.dispatchEvent(
      new CustomEvent(AUTH_EVENTS.TOKENS_UPDATED, {
        detail: { accessToken, refreshToken },
      })
    );
  },
  clearSession: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },
};

/**
 * Instancia principal de Axios configurada hacia el backend de ShopCart.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Interceptor de Request:
 * 1. Adjunta el Bearer JWT si el usuario ha iniciado sesión.
 * 2. Adjunta siempre el header `x-guest-token` para mantener o fusionar el carrito de invitado.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const guestToken = getOrCreateGuestToken();
    if (config.headers && !config.headers[HTTP_HEADERS.GUEST_TOKEN]) {
      config.headers[HTTP_HEADERS.GUEST_TOKEN] = guestToken;
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

/**
 * Cola de peticiones en espera mientras se rota el Refresh Token (RF-01).
 * Evita condiciones de carrera cuando múltiples peticiones reciben 401 al mismo tiempo.
 */
interface QueuedPromise {
  resolve: (newToken: string) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedPromise[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Extrae el par de tokens (`accessToken` y `refreshToken`) sin importar si vienen
 * en el nivel raíz de `data` o dentro de `data.tokens`.
 */
function parseRefreshedTokens(payload: unknown): {
  accessToken: string;
  refreshToken: string;
} | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const dataObj =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;

  const nestedTokens =
    dataObj.tokens && typeof dataObj.tokens === 'object'
      ? (dataObj.tokens as Record<string, unknown>)
      : dataObj;

  const accessToken =
    (nestedTokens.accessToken as string | undefined) ??
    (dataObj.accessToken as string | undefined);
  const refreshToken =
    (nestedTokens.refreshToken as string | undefined) ??
    (dataObj.refreshToken as string | undefined);

  if (accessToken && refreshToken) {
    return { accessToken, refreshToken };
  }
  return null;
}

/**
 * Interceptor de Response:
 * Captura errores 401 (Token Expirado) y ejecuta rotación transparente con `/auth/refresh`.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH);

    // Si es 401 en un endpoint protegido y aún no se ha reintentado:
    if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const currentRefreshToken = tokenStorage.getRefreshToken();

      if (!currentRefreshToken) {
        tokenStorage.clearSession();
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.SESSION_EXPIRED));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya hay un refresh en curso, encolar esta petición hasta que termine
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Usamos axios puro para evitar entrar al mismo interceptor en caso de fallo
        const refreshResponse = await axios.post(
          `${ENV.API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken: currentRefreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newTokens = parseRefreshedTokens(refreshResponse.data);
        if (!newTokens) {
          throw new Error('Formato de respuesta inválido al renovar sesión.');
        }

        tokenStorage.setTokens(newTokens.accessToken, newTokens.refreshToken);
        processQueue(null, newTokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearSession();
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.SESSION_EXPIRED));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extrae el mensaje de error legible del formato estándar del backend:
 * `{ success: false, error: { code, message } }`
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Ocurrió un error inesperado al comunicarse con el servidor.'
): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const serverMessage =
      error.response?.data?.error?.message ?? error.response?.data?.message;
    if (serverMessage && typeof serverMessage === 'string') {
      return serverMessage;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor (verifica que la API esté activa en el puerto 3000).';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

/**
 * Extrae el código de error de negocio del backend (ej. `ERR_SIN_STOCK`, `ERR_CUPON_INVALIDO`)
 */
export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.error?.code ?? null;
  }
  return null;
}

export default apiClient;
