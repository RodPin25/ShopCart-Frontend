import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ROLE_IDS } from './config/constants';
import { AuthProvider, CartProvider, useAuth } from './context';
import {
  AdminLayout,
  AuthLayout,
  Badge,
  Button,
  Card,
  ErrorBoundary,
  PageLoader,
  RhinoHeroIllustration,
  ShopLayout,
} from './components';
import {
  AdminUsersPage,
  LoginPage,
  ProfilePage,
  RegisterPage,
} from './features/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Vista previa del Hero y tarjetas de valor de "Shop Cart" (fiel al PDF de diseño)
 * mientras se conectan los siguientes módulos de negocio.
 */
function HomePreview() {
  return (
    <div>
      <section className="relative overflow-hidden bg-white dark:bg-[#0B111E] transition-colors">
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[48%] bg-sky-50/70 dark:bg-[#0E1E40]/65 -skew-x-12 translate-x-16 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-7 bg-[#E31E24] -skew-x-12 translate-x-3 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.08] text-[#0A2259] dark:text-white">
              Todo lo que buscas
              <span className="block text-[#E31E24]">con fuerza de</span>
              <span className="block text-[#E31E24]">rinoceronte</span>
            </h1>

            <p className="text-base sm:text-lg text-[#0A2259]/80 dark:text-slate-300 max-w-md leading-relaxed">
              Tecnología, hogar, moda y mucho más en un solo lugar. Compra desde tu casa.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button variant="primary" size="lg">
                Ver ofertas
              </Button>
              <Button variant="secondary" size="lg">
                Explorar todo
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <RhinoHeroIllustration />
          </div>
        </div>
      </section>

      <div className="shopcart-stripe-bar" />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card accent="blue" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Envíos a todo el país
            </h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Recibe tu pedido en la puerta de tu casa.
            </p>
          </Card>

          <Card accent="red" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">Pago seguro</h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Compra con confianza, siempre.
            </p>
          </Card>

          <Card accent="navy" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Devoluciones fáciles
            </h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Si no te gusta, lo resolvemos.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

function RequireSession({
  allowedRoles,
  children,
}: {
  allowedRoles?: readonly number[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) {
    return <PageLoader label="Verificando sesión..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles as readonly (1 | 2 | 3)[])) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <Card accent="red" className="text-center space-y-3 p-8">
          <Badge variant="red">403 — Acceso Denegado</Badge>
          <h2 className="text-xl font-extrabold text-[#0A2259] dark:text-white">
            Permisos insuficientes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tu rol actual ({user.NombreRol}) no tiene autorización para acceder a esta vista.
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Routes>
                {/* Rutas de Autenticación (RF-01) */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/registro" element={<RegisterPage />} />
                </Route>

                {/* Rutas de Tienda y Perfil de Cliente */}
                <Route element={<ShopLayout />}>
                  <Route path="/" element={<HomePreview />} />
                  <Route
                    path="/mi-perfil"
                    element={
                      <RequireSession>
                        <ProfilePage />
                      </RequireSession>
                    }
                  />
                </Route>

                {/* Rutas del Panel Backoffice (RF-01 habilitado para pruebas de usuarios) */}
                <Route
                  path="/admin"
                  element={
                    <RequireSession allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.OPERADOR]}>
                      <AdminLayout />
                    </RequireSession>
                  }
                >
                  <Route index element={<Navigate to="/admin/usuarios" replace />} />
                  <Route
                    path="usuarios"
                    element={
                      <RequireSession allowedRoles={[ROLE_IDS.ADMIN]}>
                        <AdminUsersPage />
                      </RequireSession>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <Card accent="blue" className="p-8 text-center">
                        <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
                          Módulo en construcción
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Puedes probar la gestión de usuarios en &quot;Usuarios y Roles&quot;.
                        </p>
                      </Card>
                    }
                  />
                </Route>
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
