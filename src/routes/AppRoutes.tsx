import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROLE_IDS } from '../config/constants';
import { AdminLayout, AuthLayout, ShopLayout } from '../components';
import {
  AdminUsersPage,
  LoginPage,
  ProfilePage,
  RegisterPage,
} from '../features/auth';
import {
  AdminCatalogPage,
  CatalogPage,
  ProductDetailPage,
  PUBLIC_CATEGORIES_QUERY_KEY,
  catalogService,
} from '../features/catalog';
import { CartDrawer, CartPage } from '../features/cart';
import { CheckoutPage } from '../features/checkout';
import {
  AdminOrdersPage,
  CustomerOrderDetailPage,
  CustomerOrdersPage,
} from '../features/orders';
import { AdminInventoryPage } from '../features/inventory';
import { AdminCouponsPage } from '../features/coupons';
import { AdminDashboardPage } from '../features/dashboard';
import { AdminAuditPage } from '../features/audit';
import { ProtectedRoute } from './ProtectedRoute';

function StorefrontShell() {
  const { data: categories = [] } = useQuery({
    queryKey: PUBLIC_CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.listCategories(true),
    staleTime: 3 * 60 * 1000,
  });

  return <ShopLayout categories={categories} cartDrawerSlot={<CartDrawer />} />;
}

/**
 * Árbol declarativo de rutas de Shop Cart (RF-01 a RF-09):
 * - Rutas públicas de tienda (`/`, `/productos/:idProducto`, `/carrito`).
 * - Rutas de autenticación (`/login`, `/registro`).
 * - Rutas protegidas de cliente (`/checkout`, `/mis-pedidos`, `/mis-pedidos/:idPedido`, `/mi-perfil`).
 * - Rutas operativas (`Operador` y `Administrador`: `/admin/dashboard`, `/admin/pedidos`, `/admin/inventario`).
 * - Rutas exclusivas de `Administrador` (`/admin/catalogo`, `/admin/cupones`, `/admin/usuarios`, `/admin/auditoria`).
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Rutas de Autenticación (RF-01) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>

      {/* Rutas de Tienda Pública, Carrito y Cliente (RF-01, RF-02, RF-04, RF-05, RF-06, RF-07) */}
      <Route element={<StorefrontShell />}>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/productos/:idProducto" element={<ProductDetailPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pedidos"
          element={
            <ProtectedRoute>
              <CustomerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pedidos/:idPedido"
          element={
            <ProtectedRoute>
              <CustomerOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mi-perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Rutas del Panel Backoffice (RF-01 a RF-09) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN, ROLE_IDS.OPERADOR]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="pedidos" element={<AdminOrdersPage />} />
        <Route path="inventario" element={<AdminInventoryPage />} />

        {/* Vistas exclusivas del Administrador */}
        <Route
          path="catalogo"
          element={
            <ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]}>
              <AdminCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cupones"
          element={
            <ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]}>
              <AdminCouponsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]}>
              <AdminAuditPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback general */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
