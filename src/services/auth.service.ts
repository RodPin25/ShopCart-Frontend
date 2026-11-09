import { apiClient, tokenStorage, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  AuthSessionData,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
  UserProfileData,
} from '../types';

/**
 * Normaliza la estructura de usuario y tokens devuelta por `/auth/login` o `/auth/register`.
 */
function normalizeAuthSession(raw: AuthSessionData): {
  user: User;
  accessToken: string;
  refreshToken: string;
} {
  const user = raw.usuario ?? raw.user;
  const accessToken = raw.tokens?.accessToken ?? raw.accessToken;
  const refreshToken = raw.tokens?.refreshToken ?? raw.refreshToken;

  if (!user || !accessToken || !refreshToken) {
    throw new Error('La respuesta de autenticación del servidor está incompleta.');
  }

  return { user, accessToken, refreshToken };
}

/**
 * Servicio modular de Autenticación y Perfil (RF-01).
 */
export const authService = {
  /**
   * POST /api/auth/register
   * Registra un nuevo cliente (SP_Usuarios_RegistrarCliente).
   */
  async register(payload: RegisterPayload): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const { data } = await apiClient.post<ApiResponse<AuthSessionData>>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload
    );
    return normalizeAuthSession(data.data);
  },

  /**
   * POST /api/auth/login
   * Inicia sesión con correo y contraseña (SP_Usuarios_ObtenerPorCorreo).
   */
  async login(payload: LoginPayload): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const { data } = await apiClient.post<ApiResponse<AuthSessionData>>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload
    );
    return normalizeAuthSession(data.data);
  },

  /**
   * POST /api/auth/refresh
   * Rota el Refresh Token y obtiene un nuevo par de tokens JWT.
   */
  async refresh(refreshToken?: string): Promise<AuthTokens> {
    const tokenToUse = refreshToken ?? tokenStorage.getRefreshToken();
    if (!tokenToUse) {
      throw new Error('No existe un refresh token disponible.');
    }
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken: tokenToUse }
    );
    return data.data;
  },

  /**
   * POST /api/auth/logout
   * Cierra sesión y revoca el Refresh Token en base de datos.
   */
  async logout(refreshToken?: string): Promise<void> {
    const tokenToUse = refreshToken ?? tokenStorage.getRefreshToken();
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refreshToken: tokenToUse ?? undefined,
      });
    } finally {
      tokenStorage.clearSession();
    }
  },

  /**
   * GET /api/auth/me
   * Obtiene el perfil del usuario autenticado y su dirección principal (SP_Usuarios_ObtenerPerfilPorID).
   */
  async getMe(): Promise<UserProfileData> {
    const { data } = await apiClient.get<ApiResponse<UserProfileData | User>>(
      API_ENDPOINTS.AUTH.ME
    );
    const payload = data.data;
    if ('usuario' in payload && payload.usuario) {
      return payload;
    }
    return { usuario: payload as User, direccionPrincipal: null };
  },

  /**
   * PUT /api/auth/me
   * Actualiza nombre completo, teléfono o contraseña del usuario autenticado (SP_Usuarios_ActualizarPerfil).
   */
  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await apiClient.put<ApiResponse<{ usuario?: User } & Partial<User>>>(
      API_ENDPOINTS.AUTH.ME,
      payload
    );
    return (data.data.usuario ?? (data.data as unknown as User));
  },
};

export default authService;
