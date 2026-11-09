import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ROLE_IDS } from './config/constants';
import { AuthProvider, CartProvider, useAuth } from './context';
import {
  AdminLayout,
  AuthLayout,
  Badge,
  Card,
  ErrorBoundary,
  PageLoader,
  ShopLayout,
} from './components';
import {
  AdminUsersPage,
  LoginPage,
  ProfilePage,
  RegisterPage,
} from './features/auth';
import {
  AdminCatalogPage,
  CatalogPage,
  ProductDetailPage,
  PUBLIC_CATEGORIES_QUERY_KEY,
  catalogService,
} from './features/catalog';
import { CartDrawer, CartPage } from './features/cart';
import { CheckoutPage } from './features/checkout';
import {
  AdminOrdersPage,
  CustomerOrderDetailPage,
  CustomerOrdersPage,
} from './features/orders';
import { AdminInventoryPage } from './features/inventory';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function StorefrontShell() {
  const { data: categories = [] } = useQuery({
    queryKey: PUBLIC_CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.listCategories(true),
    staleTime: 3 * 60 * 1000,
  });

  return <ShopLayout categories={categories} cartDrawerSlot={<CartDrawer />} />;
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

                {/* Rutas de Tienda Pública, Carrito y Cliente (RF-01, RF-02, RF-04, RF-05) */}
                <Route element={<StorefrontShell />}>
                  <Route path="/" element={<CatalogPage />} />
                  <Route path="/productos/:idProducto" element={<ProductDetailPage />} />
                  <Route path="/carrito" element={<CartPage />} />
                  <Route
                    path="/checkout"
                    element={
                      <RequireSession>
                        <CheckoutPage />
                      </RequireSession>
                    }
                  />
                  <Route
                    path="/mis-pedidos"
                    element={
                      <RequireSession>
                        <CustomerOrdersPage />
                      </RequireSession>
                    }
                  />
                  <Route
                    path="/mis-pedidos/:idPedido"
                    element={
                      <RequireSession>
                        <CustomerOrderDetailPage />
                      </RequireSession>
                    }
                  />
                  <Route
                    path="/mi-perfil"
                    element={
                      <RequireSession>
                        <ProfilePage />
                      </RequireSession>
                    }
                  />
                </Route>

                {/* Rutas del Panel Backoffice (RF-01, RF-02) */}
                <Route
                  path="/admin"
                  element={
                    <RequireSession allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.OPERADOR]}>
                      <AdminLayout />
                    </RequireSession>
                  }
                >
                  <Route index element={<Navigate to="/admin/pedidos" replace />} />
                  <Route path="pedidos" element={<AdminOrdersPage />} />
                  <Route path="inventario" element={<AdminInventoryPage />} />
                  <Route
                    path="catalogo"
                    element={
                      <RequireSession allowedRoles={[ROLE_IDS.ADMIN]}>
                        <AdminCatalogPage />
                      </RequireSession>
                    }
                  />
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
                          Ya puedes probar &quot;Catálogo y Precios&quot; y &quot;Usuarios y Roles&quot;.
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
