import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Trash2,
  X,
} from 'lucide-react';
import { formatGTQ } from '../../../config/constants';
import { applyCouponSchema, type ApplyCouponFormValues } from '../../../config/schemas';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageLoader,
} from '../../../components';
import { useCartController } from '../hooks/useCartController';
import { CartItemRow } from './CartItemRow';

/**
 * Página completa del Carrito de Compras (`/carrito` — RF-04 y RF-05).
 * Permite administrar líneas con bloqueo de `StockDisponible`, validar un cupón promocional
 * y visualizar el desglose exacto sin errores de redondeo en Quetzales (GTQ).
 */
export function CartPage() {
  const {
    items,
    totalUnits,
    subtotal,
    discountAmount,
    subtotalSinIVA,
    taxAmount,
    total,
    appliedCouponCode,
    isLoading,
    isMutating,
    error,
    clearError,
    itemsWithStockWarning,
    canProceedToCheckout,
    couponFeedback,
    clearCouponFeedback,
    handleIncrement,
    handleDecrement,
    removeItem,
    clearCart,
    handleApplyCouponCode,
    handleRemoveCoupon,
    handleGoToCheckout,
  } = useCartController();

  const couponForm = useForm<ApplyCouponFormValues>({
    resolver: zodResolver(applyCouponSchema),
    defaultValues: {
      codigo: appliedCouponCode ?? '',
    },
  });

  const onSubmitCoupon = async (values: ApplyCouponFormValues) => {
    await handleApplyCouponCode(values.codigo);
  };

  if (isLoading && items.length === 0) {
    return <PageLoader label="Cargando tu carrito de compras..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1E2D4A] pb-5">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:text-[#E31E24] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Seguir comprando
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white">
            Carrito de Compras
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Revisa tus productos, aplica un cupón de descuento y procede al pago seguro
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            disabled={isMutating}
            onClick={() => void clearCart()}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Vaciar carrito ({totalUnits})
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" title="Aviso del carrito" onClose={clearError}>
          {error}
        </Alert>
      )}

      {itemsWithStockWarning.length > 0 && (
        <Alert variant="warning" title="Ajusta las cantidades antes de continuar">
          Uno o más productos de tu carrito superan la existencia disponible actual. Ajusta la
          cantidad para poder continuar al Checkout.
        </Alert>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Tu carrito de compras está vacío"
          description="Agrega productos desde el catálogo para calcular tu pedido en Quetzales."
          action={
            <Link to="/">
              <Button variant="primary" size="lg">
                Explorar catálogo
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Líneas del Carrito */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <CartItemRow
                key={item.IDVariante}
                item={item}
                disabled={isMutating}
                onIncrement={(id, qty, stock) => void handleIncrement(id, qty, stock)}
                onDecrement={(id, qty) => void handleDecrement(id, qty)}
                onRemove={(id) => void removeItem(id)}
              />
            ))}
          </div>

          {/* Columna Derecha: Cupón (RF-05) y Resumen Financiero Exacto en GTQ (RF-04) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tarjeta de Cupón Promocional (RF-05) */}
            <Card accent="blue" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
                  <TicketPercent className="w-5 h-5 text-[#E31E24]" />
                  <span>Cupón de Descuento</span>
                </h2>
                {appliedCouponCode && (
                  <Badge variant="success">{appliedCouponCode}</Badge>
                )}
              </div>

              {couponFeedback && (
                <Alert variant={couponFeedback.type} onClose={clearCouponFeedback}>
                  {couponFeedback.message}
                </Alert>
              )}

              {appliedCouponCode ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-xs">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 block">
                      Cupón {appliedCouponCode} activo
                    </span>
                    <span className="text-emerald-600/90 dark:text-emerald-400">
                      Ahorras {formatGTQ(discountAmount)} en este pedido
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveCoupon()}
                    className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                    aria-label="Quitar cupón"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={couponForm.handleSubmit(onSubmitCoupon)}
                  className="flex items-start gap-2"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Ej. BIENVENIDA10"
                      error={couponForm.formState.errors.codigo?.message}
                      {...couponForm.register('codigo')}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={couponForm.formState.isSubmitting || isMutating}
                  >
                    Aplicar
                  </Button>
                </form>
              )}
            </Card>

            {/* Desglose Matemático Exacto en GTQ con IVA 12% incluido (RF-04) */}
            <Card accent="red" className="space-y-5">
              <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
                Resumen del Pedido
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal ({totalUnits} unidades)</span>
                  <span className="font-bold">{formatGTQ(subtotal)}</span>
                </div>

                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Descuento aplicado</span>
                  <span className="font-bold">- {formatGTQ(discountAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-[#1E2D4A] space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Base imponible (sin IVA)</span>
                    <span>{formatGTQ(subtotalSinIVA)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA incluido (12%)</span>
                    <span>{formatGTQ(taxAmount)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#1E2D4A] flex items-baseline justify-between">
                  <span className="text-base font-extrabold text-[#0A2259] dark:text-white">
                    Total con IVA
                  </span>
                  <span className="text-2xl font-extrabold text-[#E31E24]">
                    {formatGTQ(total)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canProceedToCheckout}
                onClick={handleGoToCheckout}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Continuar al Checkout
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-4 h-4 text-[#E31E24] shrink-0" />
                <span>Reserva garantizada de inventario por 15 minutos al iniciar el pago</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
