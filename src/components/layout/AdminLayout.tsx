import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileSearch,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Store,
  Sun,
  Tags,
  TicketPercent,
  Users,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context';
import { useTheme } from '../../hooks';
import { BrandLogo } from '../ui/BrandLogo';
import { Badge } from '../ui/Badge';

interface AdminNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
  badgeText?: string;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard y Reportes',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    to: '/admin/pedidos',
    label: 'Pedidos y Devoluciones',
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    to: '/admin/inventario',
    label: 'Inventario y Kardex',
    icon: <Boxes className="w-4 h-4" />,
  },
  {
    to: '/admin/catalogo',
    label: 'Catálogo y Precios',
    icon: <Tags className="w-4 h-4" />,
    adminOnly: true,
  },
  {
    to: '/admin/cupones',
    label: 'Cupones y Promociones',
    icon: <TicketPercent className="w-4 h-4" />,
    adminOnly: true,
  },
  {
    to: '/admin/usuarios',
    label: 'Usuarios y Roles',
    icon: <Users className="w-4 h-4" />,
    adminOnly: true,
  },
  {
    to: '/admin/auditoria',
    label: 'Bitácora Inmutable',
    icon: <FileSearch className="w-4 h-4" />,
    adminOnly: true,
  },
];

/**
 * Layout para el equipo interno (`Operador` y `Administrador`).
 * Cumple estrictamente RF-01: Oculta de la UI cualquier módulo exclusivo de Administrador
 * cuando el usuario activo tiene rol `Operador`.
 */
export function AdminLayout({ children }: { children?: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B111E] text-[#0A2259] dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-[#0E1626] border-r border-slate-200 dark:border-[#1E2D4A] z-30">
        <div className="p-5 border-b border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between">
          <Link to="/admin/dashboard">
            <BrandLogo size="sm" subtitle="Backoffice" />
          </Link>
          <Badge variant={isAdmin ? 'red' : 'navy'}>{user?.NombreRol ?? 'Staff'}</Badge>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" aria-label="Menú operativo">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all',
                  isActive
                    ? 'bg-[#E31E24] text-white shadow-sm shadow-[#E31E24]/30'
                    : 'text-[#0A2259]/80 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162238]',
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-[#1E2D4A] space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162238] transition-colors"
          >
            <Store className="w-4 h-4 text-[#E31E24]" />
            <span>Ir a la tienda pública</span>
          </Link>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-72 h-full bg-white dark:bg-[#0E1626] p-5 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <BrandLogo size="sm" subtitle="Backoffice" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#E31E24]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1.5">
                {visibleNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all',
                        isActive
                          ? 'bg-[#E31E24] text-white'
                          : 'text-[#0A2259] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162238]',
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162238]"
            >
              <Store className="w-4 h-4 text-[#E31E24]" />
              <span>Volver a la tienda</span>
            </Link>
          </aside>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1E2D4A] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-[#1E2D4A]"
              aria-label="Abrir menú lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0A2259] dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#E31E24]" />
              <span>Centro de Operaciones — {user?.NombreCompleto}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 dark:border-[#1E2D4A] hover:bg-slate-100 dark:hover:bg-[#162238] cursor-pointer"
              aria-label="Alternar tema visual"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="shopcart-stripe-bar" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
