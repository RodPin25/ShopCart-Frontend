import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AUTH_EVENTS,
  ROLE_IDS,
  ROLE_NAMES,
  STORAGE_KEYS,
  type RoleId,
  type RoleName,
} from '../config/constants';
import {
  authService,
  cartService,
  getApiErrorMessage,
  tokenStorage,
} from '../services';
import type {
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '../types';
import { AuthContext, type AuthContextValue } from './auth.context';

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(tokenStorage.getAccessToken())
  );
  const [error, setError] = useState<string | null>(null);

  const syncGuestCartOnAuth = useCallback(async () => {
    const guestToken = localStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
    if (!guestToken) return;
    try {
      await cartService.mergeGuestCart(guestToken);
    } catch {
      // Si el carrito de invitado estaba vacío o ya fue fusionado, ignoramos silenciosamente
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setUser(null);
      writeCachedUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const profileData = await authService.getMe();
      setUser(profileData.usuario);
      writeCachedUser(profileData.usuario);
      return profileData.usuario;
    } catch {
      tokenStorage.clearSession();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar sesión activa al montar la aplicación si existe access token
  useEffect(() => {
    let isMounted = true;
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      return;
    }

    void authService
      .getMe()
      .then((profileData) => {
        if (!isMounted) return;
        setUser(profileData.usuario);
        writeCachedUser(profileData.usuario);
      })
      .catch(() => {
        if (!isMounted) return;
        tokenStorage.clearSession();
        setUser(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Escuchar evento global cuando la rotación del Refresh Token falla (401 definitivo)
  useEffect(() => {
    const handleSessionExpired = () => {
      tokenStorage.clearSession();
      setUser(null);
      setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    };

    window.addEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
    return () => {
      window.removeEventListener(
        AUTH_EVENTS.SESSION_EXPIRED,
        handleSessionExpired
      );
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<User> => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await authService.login(payload);
        tokenStorage.setTokens(session.accessToken, session.refreshToken);
        setUser(session.user);
        writeCachedUser(session.user);

        await syncGuestCartOnAuth();
        return session.user;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'Credenciales inválidas o error al iniciar sesión.'
        );
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [syncGuestCartOnAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User> => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await authService.register(payload);
        tokenStorage.setTokens(session.accessToken, session.refreshToken);
        setUser(session.user);
        writeCachedUser(session.user);

        await syncGuestCartOnAuth();
        return session.user;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'No se pudo completar el registro del cliente.'
        );
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [syncGuestCartOnAuth]
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      writeCachedUser(null);
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload): Promise<User> => {
      setError(null);
      try {
        const updatedUser = await authService.updateMe(payload);
        setUser(updatedUser);
        writeCachedUser(updatedUser);
        return updatedUser;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'No se pudo actualizar la información de tu perfil.'
        );
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  const hasRole = useCallback(
    (allowedRoles: readonly (RoleId | RoleName)[]): boolean => {
      if (!user || !user.Activo) return false;
      return allowedRoles.some(
        (role) => role === user.IDRol || role === user.NombreRol
      );
    },
    [user]
  );

  const roleFlags = useMemo(() => {
    const isAdmin = Boolean(
      user?.Activo &&
        (user.IDRol === ROLE_IDS.ADMIN || user.NombreRol === ROLE_NAMES.ADMIN)
    );
    const isOperator = Boolean(
      user?.Activo &&
        (user.IDRol === ROLE_IDS.OPERADOR ||
          user.NombreRol === ROLE_NAMES.OPERADOR)
    );
    const isCustomer = Boolean(
      user?.Activo &&
        (user.IDRol === ROLE_IDS.CLIENTE ||
          user.NombreRol === ROLE_NAMES.CLIENTE)
    );
    return {
      isAdmin,
      isOperator,
      isStaff: isAdmin || isOperator,
      isCustomer,
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && user.Activo),
      isLoading,
      error,
      ...roleFlags,
      hasRole,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      clearError,
    }),
    [
      user,
      isLoading,
      error,
      roleFlags,
      hasRole,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
