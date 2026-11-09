import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Package,
  Search,
  ShoppingCart,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, useCart } from '../../context';
import { useTheme } from '../../hooks';
import type { Category } from '../../types';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';

export interface ShopLayoutProps {
  categories?: Category[];
  cartDrawerSlot?: ReactNode;
  children?: ReactNode;
}

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_DISPLAY_CATEGORIES = [
  'Tecnología',
  'Hogar',
  'Moda',
  'Deportes',
  'Juguetes',
  'Belleza',
  'Mascotas',
];

/**
 * Layout principal de la tienda ("Shop Cart"), diseñado siguiendo fielmente el PDF:
 * - Barra superior con logo de Rinoceronte + "Shop Cart", buscador redondeado con botón rojo (#E31E24),
 *   selector de tema (Oscuro Navy / Claro), acceso según rol y carrito con contador circular rojo.
 * - Barra secundaria de categorías con subrayado rojo activo en "Todo" o la categoría seleccionada.
 */
export function ShopLayout({ categories = [], cartDrawerSlot, children }: ShopLayoutProps) {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const { totalUnits, openDrawer } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentSearch = searchParams.get('busqueda') ?? '';
  const currentCategoryId = searchParams.get('idCategoria');
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(location.pathname === '/' ? searchParams : undefined);
    const trimmed = searchInput.trim();
    if (trimmed) {
      nextParams.set('busqueda', trimmed);
    } else {
      nextParams.delete('busqueda');
    }
    nextParams.delete('numeroPagina');
    const query = nextParams.toString();
    navigate(query ? `/?${query}` : '/');
  };

  const handleSelectCategory = (idCategoria?: number, nombreFallback?: string) => {
    const nextParams = new URLSearchParams(location.pathname === '/' ? searchParams : undefined);
    if (idCategoria !== undefined) {
      nextParams.set('idCategoria', String(idCategoria));
    } else if (nombreFallback) {
      nextParams.set('busqueda', nombreFallback);
      nextParams.delete('idCategoria');
    } else {
      nextParams.delete('idCategoria');
      nextParams.delete('busqueda');
      setSearchInput('');
    }
    nextParams.delete('numeroPagina');
    const query = nextParams.toString();
    navigate(query ? `/?${query}` : '/');
  };

  const isAllSelected = !currentCategoryId && !currentSearch && location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B111E] text-[#0A2259] dark:text-slate-100 transition-colors">
      {/* Header Principal fiel al PDF */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1A263D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Fila 1: Logo + Buscador con botón rojo + Controles de Usuario y Carrito */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
            <Link to="/" className="shrink-0 focus:outline-none">
              <BrandLogo size="md" />
            </Link>

            {/* Barra de búsqueda estilo píldora con botón rojo integrado (PDF) */}
            <form
              onSubmit={handleSearchSubmit}
              className="order-3 md:order-2 w-full md:flex-1 md:max-w-xl flex items-center rounded-full border border-slate-300 dark:border-[#24324D] bg-white dark:bg-[#111927] overflow-hidden focus-within:ring-2 focus-within:ring-[#E31E24] transition-shadow"
            >
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Busca audífonos, mochilas, juguetes..."
                aria-label="Buscar productos en el catálogo"
                className="flex-1 bg-transparent px-5 py-2 text-sm text-[#0A2259] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Ejecutar búsqueda"
                className="bg-[#E31E24] hover:bg-[#C5161B] text-white px-5 py-2.5 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Acciones derechas: Tema, Panel Staff (si aplica), Cuenta y Carrito con badge rojo */}
            <div className="order-2 md:order-3 flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full border border-slate-200 dark:border-[#1E2D4A] text-[#0A2259] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162238] transition-colors cursor-pointer"
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label="Alternar tema visual"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {isStaff && (
                <Link to="/admin">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                  >
                    <span className="hidden sm:inline">Panel {user?.NombreRol}</span>
                  </Button>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/mis-pedidos"
                    className="p-2 rounded-full text-[#0A2259] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162238] transition-colors"
                    title="Mis Pedidos"
                  >
                    <Package className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/mi-perfil"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#0A2259] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162238] transition-colors"
                    title="Mi Perfil y Direcciones"
                  >
                    <UserIcon className="w-4 h-4 text-[#E31E24]" />
                    <span className="hidden lg:inline max-w-[110px] truncate">
                      {user?.NombreCompleto.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="p-2 rounded-full text-slate-400 hover:text-[#E31E24] hover:bg-slate-100 dark:hover:bg-[#162238] transition-colors cursor-pointer"
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<LogIn className="w-4 h-4 text-[#E31E24]" />}
                  >
                    Ingresar
                  </Button>
                </Link>
              )}

              {/* Botón de Carrito con el contador circular rojo exacto del PDF */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2 rounded-full text-[#0A2259] dark:text-white hover:bg-slate-100 dark:hover:bg-[#162238] transition-colors cursor-pointer"
                aria-label={`Abrir carrito de compras (${totalUnits} productos)`}
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-[#E31E24] text-white text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                  {totalUnits}
                </span>
              </button>
            </div>
          </div>

          {/* Fila 2: Barra de Categorías con indicador inferior rojo (#E31E24) como en el PDF */}
          <nav
            aria-label="Categorías principales"
            className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1"
          >
            <button
              type="button"
              onClick={() => handleSelectCategory(undefined)}
              className={clsx(
                'pb-2.5 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors cursor-pointer',
                isAllSelected
                  ? 'border-[#E31E24] text-[#0A2259] dark:text-white'
                  : 'border-transparent text-[#0A2259]/75 dark:text-slate-400 hover:text-[#0A2259] dark:hover:text-white',
              )}
            >
              Todo
            </button>

            {categories.length > 0
              ? categories.map((cat) => {
                  const isActive = currentCategoryId === String(cat.IDCategoria);
                  return (
                    <button
                      key={cat.IDCategoria}
                      type="button"
                      onClick={() => handleSelectCategory(cat.IDCategoria)}
                      className={clsx(
                        'pb-2.5 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors cursor-pointer',
                        isActive
                          ? 'border-[#E31E24] text-[#0A2259] dark:text-white font-bold'
                          : 'border-transparent text-[#0A2259]/80 dark:text-slate-400 hover:text-[#0A2259] dark:hover:text-white',
                      )}
                    >
                      {cat.NombreCategoria}
                    </button>
                  );
                })
              : DEFAULT_DISPLAY_CATEGORIES.map((name) => {
                  const isActive = currentSearch.toLowerCase() === name.toLowerCase();
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectCategory(undefined, name)}
                      className={clsx(
                        'pb-2.5 text-sm font-medium whitespace-nowrap border-b-[3px] transition-colors cursor-pointer',
                        isActive
                          ? 'border-[#E31E24] text-[#0A2259] dark:text-white font-bold'
                          : 'border-transparent text-[#0A2259]/80 dark:text-slate-400 hover:text-[#0A2259] dark:hover:text-white',
                      )}
                    >
                      {name}
                    </button>
                  );
                })}
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1">{children ?? <Outlet />}</main>

      {/* Drawer lateral del Carrito inyectado por composición */}
      {cartDrawerSlot}

      {/* Footer con la franja tricolor diagonal del PDF */}
      <footer className="mt-16 bg-slate-50 dark:bg-[#080D18] border-t border-slate-200 dark:border-[#1A263D]">
        <div className="shopcart-stripe-bar" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" subtitle="Con fuerza de rinoceronte" />
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
            © {CURRENT_YEAR} Shop Cart — Todos los precios en Quetzales (GTQ) incluyen
            IVA del 12%.
          </p>
        </div>
      </footer>
    </div>
  );
}
