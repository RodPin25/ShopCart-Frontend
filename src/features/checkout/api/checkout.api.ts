import {
  addressesService,
  couponsService,
  inventoryService,
  ordersService,
} from '../../../services';

/**
 * Capa de API del módulo `checkout` (RF-05 y RF-06).
 */
export const checkoutFeatureApi = {
  checkout: ordersService.checkout,
  reserveCart: inventoryService.reserveCartForCheckout,
  releaseReservation: inventoryService.releaseReservation,
  addresses: addressesService,
  coupons: couponsService,
};

export { ordersService, inventoryService, addressesService, couponsService };
