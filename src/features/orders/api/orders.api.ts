import { ordersService, returnsService } from '../../../services';

/**
 * Capa de API del módulo `orders` (RF-07: Pedidos y Devoluciones).
 */
export const ordersFeatureApi = {
  ...ordersService,
  returns: returnsService,
};

export { ordersService, returnsService };
