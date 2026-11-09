import { generateUniqueKey, HTTP_HEADERS, type OrderStatus } from '../config/constants';
import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  ChangeOrderStatusPayload,
  CheckoutPayload,
  CheckoutResultData,
  OrderDetailData,
  OrderFilters,
  OrderHeader,
  OrderLineItem,
  OrderListItem,
  OrderPayment,
  OrderStatusHistoryItem,
  PaginatedData,
} from '../types';

function normalizeOrderHeader(raw: Record<string, unknown>): OrderHeader {
  return {
    ...(raw as unknown as OrderHeader),
    IDPedido: Number(raw.IDPedido ?? 0),
    IDUsuario: Number(raw.IDUsuario ?? 0),
    NombreCliente: (raw.NombreCliente as string | undefined) ?? undefined,
    CorreoCliente: (raw.CorreoCliente as string | undefined) ?? undefined,
    EstadoPedido: (raw.EstadoPedido as OrderStatus) ?? 'PENDIENTE',
    Subtotal: Number(raw.Subtotal ?? 0),
    MontoDescuento: Number(raw.MontoDescuento ?? 0),
    TotalSinIVA: raw.TotalSinIVA !== undefined ? Number(raw.TotalSinIVA) : undefined,
    MontoIVA: Number(raw.MontoIVA ?? 0),
    Total: Number(raw.Total ?? 0),
    CodigoCupon: (raw.CodigoCupon as string | null | undefined) ?? null,
    FechaPedido: String(raw.FechaPedido ?? raw.FechaCreacion ?? new Date().toISOString()),
    IDDireccionEntrega: Number(raw.IDDireccionEntrega ?? raw.IDDireccion ?? 0),
    DireccionLinea:
      (raw.DireccionLinea as string | undefined) ??
      (raw.DireccionEntregaTexto as string | undefined),
  };
}

function normalizeOrderLine(raw: Record<string, unknown>): OrderLineItem {
  return {
    ...(raw as unknown as OrderLineItem),
    IDPedidoDetalle: Number(raw.IDPedidoDetalle ?? 0),
    IDPedido: Number(raw.IDPedido ?? 0),
    IDVariante: Number(raw.IDVariante ?? 0),
    SKU: String(raw.SKU ?? ''),
    NombreVariante: String(raw.NombreVariante ?? ''),
    IDProducto: Number(raw.IDProducto ?? 0),
    NombreProducto: String(raw.NombreProducto ?? ''),
    Cantidad: Number(raw.Cantidad ?? 0),
    PrecioUnitarioCongelado: Number(raw.PrecioUnitarioCongelado ?? 0),
    DescuentoLinea: Number(raw.DescuentoLinea ?? raw.DescuentoAplicado ?? 0),
    SubtotalLinea: Number(raw.SubtotalLinea ?? 0),
    CantidadDevuelta: Number(raw.CantidadDevuelta ?? raw.CantidadYaDevuelta ?? 0),
    CantidadDisponibleDevolver:
      raw.CantidadDisponibleDevolver !== undefined
        ? Number(raw.CantidadDisponibleDevolver)
        : Math.max(
            0,
            Number(raw.Cantidad ?? 0) -
              Number(raw.CantidadDevuelta ?? raw.CantidadYaDevuelta ?? 0),
          ),
  };
}

function normalizeOrderPayment(raw: Record<string, unknown>): OrderPayment {
  return {
    IDPago: Number(raw.IDPago ?? 0),
    IDPedido: Number(raw.IDPedido ?? 0),
    MetodoPago: String(raw.MetodoPago ?? ''),
    TransaccionID:
      (raw.TransaccionID as string | null | undefined) ??
      (raw.TransaccionId as string | null | undefined) ??
      null,
    MontoPagado: Number(raw.MontoPagado ?? raw.Monto ?? 0),
    EstadoPago: String(raw.EstadoPago ?? raw.Estado ?? ''),
    FechaPago: String(raw.FechaPago ?? new Date().toISOString()),
  };
}

function normalizeOrderHistory(raw: Record<string, unknown>): OrderStatusHistoryItem {
  return {
    IDHistorialEstado: Number(raw.IDHistorialEstado ?? 0),
    IDPedido: Number(raw.IDPedido ?? 0),
    EstadoAnterior: (raw.EstadoAnterior as OrderStatus | null | undefined) ?? null,
    EstadoNuevo: (raw.EstadoNuevo as OrderStatus) ?? 'PENDIENTE',
    IDUsuario: Number(raw.IDUsuario ?? 0),
    NombreUsuario:
      (raw.NombreUsuario as string | undefined) ??
      (raw.UsuarioResponsable as string | undefined),
    Motivo: (raw.Motivo as string | null | undefined) ?? null,
    FechaCambio: String(raw.FechaCambio ?? raw.FechaHora ?? new Date().toISOString()),
  };
}

function normalizeOrderDetail(raw: Record<string, unknown>): OrderDetailData {
  const rawPedido =
    raw.pedido && typeof raw.pedido === 'object'
      ? (raw.pedido as Record<string, unknown>)
      : raw;

  const rawLines = Array.isArray(raw.detalles)
    ? raw.detalles
    : Array.isArray(raw.lineas)
      ? raw.lineas
      : [];

  const rawPayments = Array.isArray(raw.pagos) ? raw.pagos : [];
  const rawHistory = Array.isArray(raw.historialEstados) ? raw.historialEstados : [];

  return {
    pedido: normalizeOrderHeader(rawPedido),
    detalles: rawLines.map((item) => normalizeOrderLine(item as Record<string, unknown>)),
    pagos: rawPayments.map((pay) => normalizeOrderPayment(pay as Record<string, unknown>)),
    historialEstados: rawHistory.map((h) =>
      normalizeOrderHistory(h as Record<string, unknown>),
    ),
  };
}

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

    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.ORDERS.CHECKOUT,
      {
        ...payload,
        idempotencyKey,
        metodoPago: payload.metodoPago ?? 'TARJETA_CREDITO',
      },
      {
        headers: {
          [HTTP_HEADERS.IDEMPOTENCY_KEY]: idempotencyKey,
        },
      },
    );

    const rawData = data.data ?? {};
    const headerObj =
      rawData.pedido && typeof rawData.pedido === 'object'
        ? (rawData.pedido as Record<string, unknown>)
        : rawData;

    const normalized = normalizeOrderHeader(headerObj);
    return {
      IDPedido: normalized.IDPedido,
      EstadoPedido: normalized.EstadoPedido,
      Subtotal: normalized.Subtotal,
      MontoDescuento: normalized.MontoDescuento,
      MontoIVA: normalized.MontoIVA,
      Total: normalized.Total,
      FechaPedido: normalized.FechaPedido,
      FueRespuestaIdempotente: Boolean(headerObj.FueRespuestaIdempotente),
    };
  },

  /**
   * GET /api/orders
   * Lista pedidos con filtros server-side por estado, cliente y rango de fechas (SP_Pedidos_Listar).
   */
  async listOrders(
    filters: OrderFilters = {},
  ): Promise<PaginatedData<OrderListItem>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Record<string, unknown>>>>(
      API_ENDPOINTS.ORDERS.BASE,
      { params: filters },
    );
    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items) ? rawPaginated.items : [];
    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeOrderHeader(item)),
    };
  },

  /**
   * GET /api/orders/{idPedido}
   * Obtiene el detalle completo de un pedido: encabezado, líneas con precio congelado, pagos e historial de estados (SP_Pedidos_ObtenerDetalle).
   */
  async getOrderById(idPedido: number): Promise<OrderDetailData> {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.ORDERS.BY_ID(idPedido),
    );
    return normalizeOrderDetail(data.data ?? {});
  },

  /**
   * PATCH /api/orders/{idPedido}/status
   * Avanza o cancela el estado de un pedido validando transiciones y reintegrando existencias al Kardex si se cancela (SP_Pedidos_CambiarEstado).
   */
  async changeOrderStatus(
    idPedido: number,
    payload: ChangeOrderStatusPayload,
  ): Promise<OrderDetailData> {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.ORDERS.STATUS(idPedido),
      payload,
    );
    return normalizeOrderDetail(data.data ?? {});
  },
};

export default ordersService;
