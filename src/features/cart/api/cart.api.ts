import { cartService, couponsService } from '../../../services';

/**
 * Capa de API del módulo `cart` (RF-04 y validación de cupón RF-05).
 */
export const cartFeatureApi = {
  ...cartService,
  coupons: couponsService,
};

export { cartService, couponsService };
