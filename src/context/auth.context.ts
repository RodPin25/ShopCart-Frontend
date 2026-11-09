import { createContext, useContext } from 'react';
import type { RoleId, RoleName } from '../config/constants';
import type {
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '../types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOperator: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  hasRole: (allowedRoles: readonly (RoleId | RoleName)[]) => boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un <AuthProvider>.');
  }
  return context;
}
