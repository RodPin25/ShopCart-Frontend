import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  CreateUserByAdminPayload,
  PaginatedData,
  Role,
  UpdateUserStatusPayload,
  User,
  UserFilters,
} from '../types';

/**
 * Servicio modular de Administración de Usuarios y Roles (RF-01 - Solo Admin).
 */
export const usersService = {
  /**
   * GET /api/users
   * Lista usuarios con paginación y filtros por rol, estado activo y búsqueda (SP_Usuarios_ListarUsuarios).
   */
  async listUsers(filters: UserFilters = {}): Promise<PaginatedData<User>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<User>>>(
      API_ENDPOINTS.USERS.BASE,
      { params: filters }
    );
    return data.data;
  },

  /**
   * POST /api/users
   * Crea un usuario con rol específico: Admin, Operador o Cliente (SP_Usuarios_CrearUsuarioPorAdmin).
   */
  async createUser(payload: CreateUserByAdminPayload): Promise<User> {
    const { data } = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.USERS.BASE,
      payload
    );
    return data.data;
  },

  /**
   * GET /api/users/roles
   * Lista el catálogo de roles del sistema (SP_Usuarios_ListarRoles).
   */
  async listRoles(): Promise<Role[]> {
    const { data } = await apiClient.get<ApiResponse<Role[]>>(
      API_ENDPOINTS.USERS.ROLES
    );
    return data.data;
  },

  /**
   * PATCH /api/users/{idUsuario}/status
   * Activa/desactiva un usuario sin borrarlo o cambia su rol (SP_Usuarios_CambiarEstadoActivo).
   */
  async updateUserStatus(
    idUsuario: number,
    payload: UpdateUserStatusPayload
  ): Promise<User> {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      API_ENDPOINTS.USERS.STATUS(idUsuario),
      payload
    );
    return data.data;
  },
};

export default usersService;
