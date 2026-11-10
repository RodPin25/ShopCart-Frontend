import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { RoleId } from '../config/constants';
import { useAuth } from '../context';
import { Badge, Button, Card, PageLoader } from '../components';

export interface ProtectedRouteProps {
  allowedRoles?: readonly RoleId[];
  children: ReactNode;
}

/**
 * Guardián declarativo de Rutas Protegidas y Control de Acceso Basado en Roles (RF-01):
 * - Si aún está restaurando la sesión, muestra un indicador de carga.
 * - Si no está autenticado, redirige a `/login`.
 * - Si está autenticado pero su `IDRol` no figura en `allowedRoles`, despliega una pantalla `403 — Acceso Denegado`.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) {
    return <PageLoader label="Verificando credenciales y permisos de sesión..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <Card accent="red" className="text-center space-y-4 p-8">
          <Badge variant="red">403 — Acceso Denegado (RF-01)</Badge>
          <h2 className="text-xl font-extrabold text-[#0A2259] dark:text-white">
            Permisos insuficientes para este módulo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tu sesión activa como <strong>{user.NombreRol}</strong> no cuenta con autorización
            para acceder a esta sección administrativa.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/">
              <Button variant="secondary" size="sm">
                Ir a la tienda
              </Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button variant="primary" size="sm">
                Ir al panel permitido
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
