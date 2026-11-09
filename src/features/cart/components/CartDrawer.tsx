import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatGTQ } from '../../../config/constants';
import { Alert, Button, EmptyState, Spinner } from '../../../components';
import { useCartController } from '../hooks/useCartController';
import { CartItemRow } from './CartItemRow';

/**
 * Drawer lateral reactivo del Carrito de Compras (RF-04).
 * Accesible desde el icono de carrito con contador rojo en el Navbar de ShopLayout.
 */
export function CartDrawer() {
  const {
    items,
    totalUnits,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    appliedCouponCode,
    isDrawerOpen,
    closeDrawer,
    isLoading,
    isMutating,
    error,
    clearError,
    canProceedToCheckout,
    handleIncrement,
    handleDecrement,
    removeItem,
    clearCart,
    handleGoToCheckout,
  } = useCartController();

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
      onClick={closeDrawer}
    >
      <aside
        className="w-full max-w-lg h-full bg-slate-50 dark:bg-[#0B111E] border-l border-slate-200 dark:border-[#1E2D4A] shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 bg-white dark:bg-[#111927] border-b border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E31E24]/15 text-[#E31E24] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white">
                Tu Carrito ({totalUnits})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Precios en Quetzales (GTQ) con IVA 12% incluido
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 rounded-full text-slate-400 hover:text-[#E31E24] hover:bg-slate-100 dark:hover:bg-[#162238] cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {error && (
            <Alert variant="error" onClose={clearError}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Spinner label="Actualizando tu carrito..." />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-7 h-7" />}
              title="Tu carrito está vacío"
              description="Explora el catálogo y agrega tus productos favoritos."
              action={
                <Button variant="primary" size="sm" onClick={closeDrawer}>
                  Explorar productos
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-500">
                  {items.length} {items.length === 1 ? 'línea' : 'líneas'} de producto
                </span>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => void clearCart()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar carrito
                </button>
              </div>

              {items.map((item) => (
                <CartItemRow
                  key={item.IDVariante}
                  item={item}
                  compact
                  disabled={isMutating}
                  onIncrement={(id, qty, stock) => void handleIncrement(id, qty, stock)}
                  onDecrement={(id, qty) => void handleDecrement(id, qty)}
                  onRemove={(id) => void removeItem(id)}
                  onNavigate={closeDrawer}
                />
              ))}
            </>
          )}
        </div>

        {/* Resumen Financiero y Acciones */}
        {items.length > 0 && (
          <div className="p-6 bg-white dark:bg-[#111927] border-t border-slate-200 dark:border-[#1E2D4A] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold">{formatGTQ(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Descuento ({appliedCouponCode})</span>
                  <span>- {formatGTQ(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA (12% incluido)</span>
                <span>{formatGTQ(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-lg font-extrabold text-[#0A2259] dark:text-white pt-2 border-t border-slate-200 dark:border-[#1E2D4A]">
                <span>Total a pagar</span>
                <span className="text-[#E31E24]">{formatGTQ(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/carrito" onClick={closeDrawer}>
                <Button variant="secondary" fullWidth>
                  Ver carrito / Cupón
                </Button>
              </Link>

              <Button
                variant="primary"
                fullWidth
                disabled={!canProceedToCheckout}
                onClick={handleGoToCheckout}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Ir al Checkout
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
