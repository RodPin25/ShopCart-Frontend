import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { generateUniqueKey, STORAGE_KEYS } from '../../../config/constants';
import { ENV } from '../../../config/env';
import { useCart } from '../../../context';
import { useCountdown } from '../../../hooks';
import { checkoutFeatureApi } from '../api/checkout.api';
import type { CheckoutResultData } from '../types';

/**
 * Custom Hook que encapsula toda la lógica de negocio del Checkout (RF-05 y RF-06):
 * 1. Reserva temporal de inventario por 15 minutos al iniciar el Checkout (`POST /inventory/reservations/cart`).
 * 2. Cuenta regresiva en vivo de 15 minutos con disparo de modal de expiración al llegar a 00:00.
 * 3. Generación de `Idempotency-Key` única por intento de compra para evitar cobros o pedidos duplicados.
 * 4. Bloqueo síncrono inmediato (`inFlightRef`) del botón "Pagar" para impedir doble clic accidental.
 */
export function useCheckout() {
  const cartContext = useCart();

  // Llave de idempotencia única que se mantiene estable durante la sesión de Checkout
  // para que cualquier reintento por falla de red envíe el mismo Idempotency-Key (RF-06).
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    generateUniqueKey('chk'),
  );

  // Cada ingreso al Checkout inicia una nueva ventana de reserva de 15 minutos
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);

  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CheckoutResultData | null>(null);

  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Candado síncrono contra doble clic en el mismo frame antes del re-render de React
  const inFlightPaymentRef = useRef<boolean>(false);
  // Guarda el último IDCarrito reservado en esta instancia de Checkout para reiniciar si cambia de carrito
  const reservedCartIdRef = useRef<number | null>(null);

  const handleReservationExpired = useCallback(() => {
    if (completedOrder) return;
    window.sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_RESERVATION_EXPIRES_AT);
    setIsExpiredModalOpen(true);
    void checkoutFeatureApi.releaseReservation().catch(() => undefined);
  }, [completedOrder]);

  const countdown = useCountdown({
    expiresAt: reservationExpiresAt,
    totalDurationMinutes: ENV.RESERVATION_TTL_MINUTES,
    onExpire: handleReservationExpired,
  });

  const reserveMutation = useMutation({
    mutationFn: (idCarrito: number) => checkoutFeatureApi.reserveCart(idCarrito),
    onSuccess: (reservation) => {
      const fallbackExpiration = new Date(
        Date.now() + ENV.RESERVATION_TTL_MINUTES * 60 * 1000,
      ).toISOString();

      const parsedServerExp = reservation?.fechaExpiracion
        ? Date.parse(reservation.fechaExpiracion)
        : Number.NaN;

      const targetIso =
        !Number.isNaN(parsedServerExp) && parsedServerExp > Date.now()
          ? reservation.fechaExpiracion!
          : fallbackExpiration;

      window.sessionStorage.setItem(STORAGE_KEYS.CHECKOUT_RESERVATION_EXPIRES_AT, targetIso);
      setReservationExpiresAt(targetIso);
      setIsExpiredModalOpen(false);
    },
  });

  const { mutate: triggerReserve } = reserveMutation;

  const startCartReservation = useCallback(async () => {
    const idCarrito = cartContext.cart?.IDCarrito;
    if (!idCarrito || cartContext.items.length === 0) {
      return;
    }
    setIsExpiredModalOpen(false);
    reservedCartIdRef.current = idCarrito;
    await reserveMutation.mutateAsync(idCarrito);
  }, [cartContext.cart?.IDCarrito, cartContext.items.length, reserveMutation]);

  // Iniciar o renovar reserva de 15 minutos cada vez que se entra al Checkout o cambia el carrito activo
  useEffect(() => {
    const idCarrito = cartContext.cart?.IDCarrito;
    if (
      !idCarrito ||
      cartContext.items.length === 0 ||
      completedOrder ||
      reservedCartIdRef.current === idCarrito
    ) {
      return;
    }

    window.sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_RESERVATION_EXPIRES_AT);
    reservedCartIdRef.current = idCarrito;
    triggerReserve(idCarrito);
  }, [
    cartContext.cart?.IDCarrito,
    cartContext.items.length,
    completedOrder,
    triggerReserve,
  ]);

  const applyCouponInCheckout = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setCouponFeedback(null);
    try {
      const result = await cartContext.applyCoupon(code);
      if (result.valido) {
        setCouponFeedback({
          type: 'success',
          message: result.mensaje || `Cupón ${code} aplicado exitosamente.`,
        });
      } else {
        setCouponFeedback({
          type: 'error',
          message: result.mensaje || 'El cupón no cumple los requisitos.',
        });
      }
    } catch (err) {
      setCouponFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const removeCouponInCheckout = async () => {
    setCouponFeedback(null);
    await cartContext.removeCoupon();
  };

  const submitIdempotentPayment = async (params: {
    idDireccion: number;
    metodoPago: string;
    transaccionId?: string;
  }): Promise<CheckoutResultData | null> => {
    // Bloqueo síncrono inmediato contra doble clic
    if (inFlightPaymentRef.current || isProcessingPayment) {
      return null;
    }

    inFlightPaymentRef.current = true;
    setIsProcessingPayment(true);
    setCheckoutError(null);

    try {
      const orderResult = await checkoutFeatureApi.checkout({
        idDireccion: params.idDireccion,
        idempotencyKey,
        codigoCupon: cartContext.appliedCouponCode ?? undefined,
        metodoPago: params.metodoPago,
        transaccionId: params.transaccionId?.trim() || undefined,
      });

      window.sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_RESERVATION_EXPIRES_AT);
      setReservationExpiresAt(null);
      setCompletedOrder(orderResult);

      // Refrescar el carrito (que ahora quedó convertido en pedido y vacío)
      await cartContext.fetchCart();
      return orderResult;
    } catch (err) {
      setCheckoutError(getApiErrorMessage(err));
      return null;
    } finally {
      inFlightPaymentRef.current = false;
      setIsProcessingPayment(false);
    }
  };

  const regenerateIdempotencyKey = () => {
    setIdempotencyKey(generateUniqueKey('chk'));
  };

  return {
    cart: cartContext.cart,
    items: cartContext.items,
    totalUnits: cartContext.totalUnits,
    subtotal: cartContext.subtotal,
    discountAmount: cartContext.discountAmount,
    subtotalSinIVA: cartContext.subtotalSinIVA,
    taxAmount: cartContext.taxAmount,
    total: cartContext.total,
    appliedCouponCode: cartContext.appliedCouponCode,
    idempotencyKey,
    regenerateIdempotencyKey,
    countdown,
    isReserving: reserveMutation.isPending,
    reservationError: reserveMutation.error ? getApiErrorMessage(reserveMutation.error) : null,
    retryReservation: startCartReservation,
    isExpiredModalOpen,
    isProcessingPayment,
    checkoutError,
    clearCheckoutError: () => setCheckoutError(null),
    completedOrder,
    couponFeedback,
    clearCouponFeedback: () => setCouponFeedback(null),
    applyCouponInCheckout,
    removeCouponInCheckout,
    submitIdempotentPayment,
  };
}
