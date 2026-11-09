import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../../config/api';
import { useAuth, useCart } from '../../../context';

/**
 * Custom Hook que encapsula las reglas de negocio del Carrito de Compras (RF-04, RF-05):
 * - Cálculos precisos en Quetzales (GTQ) con IVA del 12% incluido.
 * - Bloqueo de incremento cuando `Cantidad >= StockDisponible` (existencia física menos reservas).
 * - Aplicación de cupón promocional con retroalimentación específica de vigencia/monto mínimo/usos.
 * - Validación previa antes de avanzar al Checkout.
 */
export function useCartController() {
  const cartContext = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const itemsWithStockWarning = useMemo(
    () =>
      cartContext.items.filter(
        (item) => !item.StockSuficiente || item.Cantidad > item.StockDisponible,
      ),
    [cartContext.items],
  );

  const canProceedToCheckout =
    cartContext.items.length > 0 &&
    itemsWithStockWarning.length === 0 &&
    !cartContext.isLoading &&
    !cartContext.isMutating;

  const handleIncrement = async (idVariante: number, currentQty: number, stockDisponible: number) => {
    if (currentQty >= stockDisponible) {
      return;
    }
    await cartContext.updateItemQuantity(idVariante, currentQty + 1);
  };

  const handleDecrement = async (idVariante: number, currentQty: number) => {
    if (currentQty <= 1) {
      await cartContext.removeItem(idVariante);
      return;
    }
    await cartContext.updateItemQuantity(idVariante, currentQty - 1);
  };

  const handleApplyCouponCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setCouponFeedback(null);
    try {
      const validation = await cartContext.applyCoupon(code);
      if (validation.valido) {
        setCouponFeedback({
          type: 'success',
          message: validation.mensaje || `Cupón ${code} aplicado correctamente.`,
        });
      } else {
        setCouponFeedback({
          type: 'error',
          message: validation.mensaje || 'El cupón ingresado no cumple las condiciones.',
        });
      }
    } catch (err) {
      setCouponFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponFeedback(null);
    await cartContext.removeCoupon();
  };

  const handleGoToCheckout = () => {
    cartContext.closeDrawer();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  return {
    ...cartContext,
    itemsWithStockWarning,
    canProceedToCheckout,
    couponFeedback,
    clearCouponFeedback: () => setCouponFeedback(null),
    handleIncrement,
    handleDecrement,
    handleApplyCouponCode,
    handleRemoveCoupon,
    handleGoToCheckout,
  };
}
