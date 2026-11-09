import { generateUniqueKey, HTTP_HEADERS } from '../config/constants';
import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  ChangeOrderStatusPayload,
  CheckoutPayload,
  CheckoutResultData,
  OrderDetailData,
  OrderFilters,
  OrderListItem,
  PaginatedData,
} from '../types';

/**
 * Servicio modular de Checkout Idempotente y Gestión de Pedidos (RF-06 & RF-07).
 */
export const ordersService = {
  /**
   * POST /api/orders/checkout
   * Ejecuta el Checkout atómico e idempotente enviando `Idempotency-Key` en headers y body (SP_Pedidos_CrearCheckout).
   */
  async checkout(payload: CheckoutPayload): Promise<CheckoutResultData> {
    const idempotencyKey =
      payload.idempotencyKey?.trim() || generateUniqueKey('chk');

    const { data } = await apiClient.post<ApiResponse<CheckoutResultData>>(
      API_ENDPOINTS.ORDERS.CHECKOUT,
      {
        ...payload,
        idempotencyKey,
        metodoPago: payload.metodoPago ?? 'TARJETA',
      },
      {
        headers: {
          [HTTP_HEADERS.IDEMPOTENCY_KEY]: idempotencyKey,
        },
      }
    );
    return data.data;
  },

  /**
   * GET /api/orders
   * Lista pedidos con filtros server-side por estado, cliente y rango de fechas (SP_Pedidos_Listar).
   */
  async listOrders(
    filters: OrderFilters = {}
  ): Promise<PaginatedData<OrderListItem>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<OrderListItem>>>(
      API_ENDPOINTS.ORDERS.BASE,
      { params: filters }
    );
    return data.data;
  },

  /**
   * GET /api/orders/{idPedido}
   * Obtiene el detalle completo de un pedido: encabezado, líneas con precio congelado, pagos e historial de estados (SP_Pedidos_ObtenerDetalle).
   */
  async getOrderById(idPedido: number): Promise<OrderDetailData> {
    const { data } = await apiClient.get<ApiResponse<OrderDetailData>>(
      API_ENDPOINTS.ORDERS.BY_ID(idPedido)
    );
    return data.data;
  },

  /**
   * PATCH /api/orders/{idPedido}/status
   * Avanza o cancela el estado de un pedido validando transiciones y reintegrando existencias al Kardex si se cancela (SP_Pedidos_CambiarEstado).
   */
  async changeOrderStatus(
    idPedido: number,
    payload: ChangeOrderStatusPayload
  ): Promise<OrderDetailData | OrderListItem> {
    const { data } = await apiClient.patch<
      ApiResponse<OrderDetailData | OrderListItem>
    >(API_ENDPOINTS.ORDERS.STATUS(idPedido), payload);
    return data.data;
  },
};

export default ordersService;
