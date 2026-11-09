import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { roundCurrency } from '../config/constants';
import { ENV } from '../config/env';
import {
  cartService,
  couponsService,
  getApiErrorMessage,
} from '../services';
import type {
  CartData,
  CartItem,
  CartSummary,
  CouponValidationData,
} from '../types';
import { useAuth } from './auth.context';
import { CartContext, type CartContextValue } from './cart.context';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [cart, setCart] = useState<CartSummary | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null
  );
  const [couponValidation, setCouponValidation] =
    useState<CouponValidationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const applyCartData = useCallback((data: CartData | null) => {
    if (!data) {
      setCart(null);
      setItems([]);
      return;
    }
    setCart(data.carrito ?? null);
    setItems(Array.isArray(data.items) ? data.items : []);
    if (data.carrito?.CodigoCupon && data.carrito.CuponValido) {
      setAppliedCouponCode(data.carrito.CodigoCupon);
    }
  }, []);

  const fetchCart = useCallback(
    async (couponCode?: string): Promise<CartData | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const codeToUse = couponCode ?? appliedCouponCode ?? undefined;
        const data = await cartService.getCart(codeToUse);
        applyCartData(data);
        return data;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'No se pudo sincronizar el carrito de compras.'
        );
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [appliedCouponCode, applyCartData]
  );

  // Recargar carrito al iniciar o cambiar de sesión (invitado <-> usuario autenticado)
  useEffect(() => {
    let isMounted = true;
    void cartService
      .getCart(appliedCouponCode ?? undefined)
      .then((data) => {
        if (!isMounted) return;
        applyCartData(data);
      })
      .catch(() => {
        // Mantenemos estado vacío limpio si el carrito aún no existe
      });
    return () => {
      isMounted = false;
    };
  }, [user?.IDUsuario, appliedCouponCode, applyCartData]);

  const addItem = useCallback(
    async (idVariante: number, cantidad = 1): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        const updatedCart = await cartService.addOrUpdateItem({
          idVariante,
          cantidad,
          modoOperacion: 'SUMAR',
        });
        applyCartData(updatedCart);
        return true;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'No se pudo agregar el producto al carrito. Verifica la existencia disponible.'
        );
        setError(message);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCartData]
  );

  const removeItem = useCallback(
    async (idVariante: number): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        const updatedCart = await cartService.removeItem(idVariante);
        applyCartData(updatedCart);
        return true;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'No se pudo eliminar el artículo del carrito.'
        );
        setError(message);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCartData]
  );

  const updateItemQuantity = useCallback(
    async (idVariante: number, cantidad: number): Promise<boolean> => {
      if (cantidad <= 0) {
        return removeItem(idVariante);
      }
      setIsMutating(true);
      setError(null);
      try {
        const updatedCart = await cartService.setItemQuantity(
          idVariante,
          cantidad
        );
        applyCartData(updatedCart);
        return true;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'La cantidad solicitada supera la existencia disponible.'
        );
        setError(message);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCartData, removeItem]
  );

  const clearCart = useCallback(async (): Promise<boolean> => {
    setIsMutating(true);
    setError(null);
    try {
      await cartService.clearCart();
      setCart(null);
      setItems([]);
      setAppliedCouponCode(null);
      setCouponValidation(null);
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err, 'No se pudo vaciar el carrito.');
      setError(message);
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const applyCoupon = useCallback(
    async (codigo: string): Promise<CouponValidationData> => {
      const normalizedCode = codigo.trim().toUpperCase();
      setIsMutating(true);
      setError(null);
      try {
        const validation = await couponsService.validateCoupon({
          codigo: normalizedCode,
        });
        setCouponValidation(validation);

        if (validation.valido) {
          setAppliedCouponCode(normalizedCode);
          await fetchCart(normalizedCode);
        } else {
          setAppliedCouponCode(null);
        }

        return validation;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          'El cupón ingresado no es válido o no cumple las condiciones.'
        );
        const rejectedResult: CouponValidationData = {
          valido: false,
          mensaje: message,
          montoDescuento: 0,
          nuevoTotal: cart?.Total ?? 0,
        };
        setCouponValidation(rejectedResult);
        setAppliedCouponCode(null);
        return rejectedResult;
      } finally {
        setIsMutating(false);
      }
    },
    [cart?.Total, fetchCart]
  );

  const removeCoupon = useCallback(async () => {
    setAppliedCouponCode(null);
    setCouponValidation(null);
    await fetchCart('');
  }, [fetchCart]);

  const getItemQuantityInCart = useCallback(
    (idVariante: number): number => {
      const found = items.find((item) => item.IDVariante === idVariante);
      return found ? found.Cantidad : 0;
    },
    [items]
  );

  /**
   * RF-04: Restricción en la UI — deshabilitar incremento cuando se alcance
   * la existencia disponible (StockFisico - StockReservado).
   */
  const canIncrementVariant = useCallback(
    (idVariante: number, stockDisponible: number): boolean => {
      const currentQty = getItemQuantityInCart(idVariante);
      return currentQty < stockDisponible && stockDisponible > 0;
    },
    [getItemQuantityInCart]
  );

  /**
   * RF-04: Cálculos matemáticos precisos sin fallas de coma flotante de JS.
   * Los precios publicados en GTQ incluyen el 12% de IVA.
   * Nunca permite que el total baje de Q 0.00 (RF-05).
   */
  const totals = useMemo(() => {
    const calculatedSubtotal = roundCurrency(
      items.reduce(
        (acc, item) =>
          acc + roundCurrency(item.PrecioUnitario * item.Cantidad),
        0
      )
    );

    const subtotal =
      cart?.Subtotal !== undefined
        ? roundCurrency(Number(cart.Subtotal))
        : calculatedSubtotal;

    const rawDiscount =
      couponValidation?.valido
        ? couponValidation.montoDescuento
        : (cart?.MontoDescuento ?? 0);

    // Un descuento nunca deja el total del pedido por debajo de cero (RF-05)
    const discountAmount = roundCurrency(
      Math.min(Math.max(Number(rawDiscount) || 0, 0), subtotal)
    );

    const total = roundCurrency(Math.max(subtotal - discountAmount, 0));

    // El precio ya incluye el 12% de IVA (Total = TotalSinIVA * 1.12)
    const subtotalSinIVA =
      cart?.TotalSinIVA !== undefined && !couponValidation?.valido
        ? roundCurrency(Number(cart.TotalSinIVA))
        : roundCurrency(total / (1 + ENV.IVA_RATE));

    const taxAmount =
      cart?.MontoIVA !== undefined && !couponValidation?.valido
        ? roundCurrency(Number(cart.MontoIVA))
        : roundCurrency(total - subtotalSinIVA);

    const totalItems = items.length;
    const totalUnits = items.reduce((acc, item) => acc + item.Cantidad, 0);

    return {
      totalItems,
      totalUnits,
      subtotal,
      discountAmount,
      subtotalSinIVA,
      taxAmount,
      total,
    };
  }, [cart, couponValidation, items]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setIsDrawerOpen((prev) => !prev),
    []
  );
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      items,
      ...totals,
      appliedCouponCode,
      couponValidation,
      isLoading,
      isMutating,
      error,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      fetchCart,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      getItemQuantityInCart,
      canIncrementVariant,
      clearError,
    }),
    [
      cart,
      items,
      totals,
      appliedCouponCode,
      couponValidation,
      isLoading,
      isMutating,
      error,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      fetchCart,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      getItemQuantityInCart,
      canIncrementVariant,
      clearError,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
