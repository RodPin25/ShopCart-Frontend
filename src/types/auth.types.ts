import type { RoleId, RoleName } from '../config/constants';
import type { PaginationParams } from './common.types';

/**
 * Perfil de usuario autenticado o listado en el panel de administración (RF-01).
 */
export interface User {
  IDUsuario: number;
  IDRol: RoleId;
  NombreRol: RoleName;
  Correo: string;
  NombreCompleto: string;
  Telefono: string | null;
  Activo: boolean;
  FechaCreacion?: string;
  UltimoAcceso?: string | null;
}

/**
 * Dirección de entrega de un cliente (RF-01, RF-06).
 */
export interface Address {
  IDDireccion: number;
  IDUsuario: number;
  DireccionLinea: string;
  Municipio: string;
  Departamento: string;
  CodigoPostal: string | null;
  Referencia: string | null;
  EsPrincipal: boolean;
  Activo: boolean;
  FechaCreacion?: string;
}

/**
 * Par de tokens emitidos al iniciar sesión, registrarse o rotar sesión.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string | number;
}

/**
 * Respuesta de `/api/auth/login` y `/api/auth/register`.
 */
export interface AuthSessionData {
  usuario?: User;
  user?: User;
  accessToken: string;
  refreshToken: string;
  tokens?: AuthTokens;
}

/**
 * Respuesta de `/api/auth/me`.
 */
export interface UserProfileData {
  usuario: User;
  direccionPrincipal?: Address | null;
}

/**
 * Payloads de autenticación y perfil.
 */
export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  correo: string;
  password: string;
  nombreCompleto: string;
  telefono?: string;
}

export interface UpdateProfilePayload {
  nombreCompleto: string;
  telefono?: string;
  password?: string;
}

/**
 * Payloads de Direcciones (RF-01).
 */
export interface AddressPayload {
  direccionLinea: string;
  municipio: string;
  departamento: string;
  codigoPostal?: string;
  referencia?: string;
  esPrincipal?: boolean;
}

/**
 * Administración de Usuarios y Roles (Solo Admin - RF-01).
 */
export interface Role {
  IDRol: RoleId;
  NombreRol: RoleName;
  Descripcion?: string;
}

export interface UserFilters extends PaginationParams {
  idRol?: RoleId;
  activo?: boolean;
  busqueda?: string;
}

export interface CreateUserByAdminPayload {
  idRol: RoleId;
  correo: string;
  password: string;
  nombreCompleto: string;
  telefono?: string;
}

export interface UpdateUserStatusPayload {
  activo: boolean;
  idRol?: RoleId;
}
