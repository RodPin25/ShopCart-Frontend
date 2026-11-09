import { createContext, useContext } from 'react';
import type {
  CartData,
  CartItem,
  CartSummary,
  CouponValidationData,
} from '../types';

export interface CartContextValue {
  cart: CartSummary | null;
  items: CartItem[];
  totalItems: number;
  totalUnits: number;
  subtotal: number;
  discountAmount: number;
  subtotalSinIVA: number;
  taxAmount: number;
  total: number;
  appliedCouponCode: string | null;
  couponValidation: CouponValidationData | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  fetchCart: (couponCode?: string) => Promise<CartData | null>;
  addItem: (idVariante: number, cantidad?: number) => Promise<boolean>;
  updateItemQuantity: (idVariante: number, cantidad: number) => Promise<boolean>;
  removeItem: (idVariante: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (codigo: string) => Promise<CouponValidationData>;
  removeCoupon: () => Promise<void>;
  getItemQuantityInCart: (idVariante: number) => number;
  canIncrementVariant: (idVariante: number, stockDisponible: number) => boolean;
  clearError: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe utilizarse dentro de un <CartProvider>.');
  }
  return context;
}
