import { apiClient, getOrCreateGuestToken, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  CartReservationData,
  InventoryAdjustmentPayload,
  KardexFilters,
  KardexMovement,
  KardexMovementType,
  PaginatedData,
  StockFilters,
  StockItem,
} from '../types';

function normalizeStockItem(raw: Record<string, unknown>): StockItem {
  const stockDisponible = Number(raw.StockDisponible ?? 0);
  return {
    IDVariante: Number(raw.IDVariante ?? 0),
    SKU: String(raw.SKU ?? ''),
    NombreVariante: String(raw.NombreVariante ?? ''),
    IDProducto: Number(raw.IDProducto ?? 0),
    NombreProducto: String(raw.NombreProducto ?? ''),
    IDCategoria: Number(raw.IDCategoria ?? 0),
    NombreCategoria: String(raw.NombreCategoria ?? ''),
    Precio: Number(raw.Precio ?? 0),
    StockFisico: Number(raw.StockFisico ?? 0),
    StockReservado: Number(raw.StockReservado ?? 0),
    StockDisponible: stockDisponible,
    SumaKardex: Number(raw.SumaKardex ?? raw.SumaMovimientosKardex ?? 0),
    Conciliado: Boolean(raw.Conciliado ?? raw.CuadraConKardex ?? true),
    BajoStock:
      raw.BajoStock !== undefined
        ? Boolean(raw.BajoStock)
        : stockDisponible <= 5,
    Activo: Boolean(raw.Activo ?? raw.VarianteActiva ?? true),
  };
}

function normalizeKardexMovement(raw: Record<string, unknown>): KardexMovement {
  return {
    IDMovimientoKardex: Number(raw.IDMovimientoKardex ?? raw.IDKardex ?? 0),
    IDVariante: Number(raw.IDVariante ?? 0),
    SKU: String(raw.SKU ?? ''),
    NombreVariante: String(raw.NombreVariante ?? ''),
    IDProducto: Number(raw.IDProducto ?? 0),
    NombreProducto: String(raw.NombreProducto ?? ''),
    TipoMovimiento:
      (raw.TipoMovimiento as KardexMovementType | undefined) ?? 'AJUSTE_ENTRADA',
    Cantidad: Number(raw.Cantidad ?? 0),
    SaldoAnterior: Number(raw.SaldoAnterior ?? raw.StockAnterior ?? 0),
    SaldoNuevo: Number(raw.SaldoNuevo ?? raw.StockActual ?? 0),
    Motivo: String(raw.Motivo ?? ''),
    IDPedidoReferencia:
      raw.IDPedidoReferencia !== undefined
        ? (raw.IDPedidoReferencia as number | null)
        : raw.IDPedido !== undefined
          ? (raw.IDPedido as number | null)
          : null,
    IDUsuario: Number(raw.IDUsuario ?? 0),
    NombreUsuario:
      (raw.NombreUsuario as string | undefined) ??
      (raw.UsuarioResponsable as string | undefined),
    FechaMovimiento: String(raw.FechaMovimiento ?? new Date().toISOString()),
  };
}

/**
 * Servicio modular de Inventario, Kardex, Ajustes Manuales y Reservas Temporales de 15 min (RF-03 & RF-06).
 */
export const inventoryService = {
  /**
   * GET /api/inventory/stock
   * Lista existencias físicas, reservadas, disponibles y su conciliación contra el Kardex (SP_Inventario_ListarExistencias).
   */
  async listStock(filters: StockFilters = {}): Promise<PaginatedData<StockItem>> {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<Record<string, unknown>>>
    >(API_ENDPOINTS.INVENTORY.STOCK, { params: filters });
    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items) ? rawPaginated.items : [];
    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeStockItem(item)),
    };
  },

  /**
   * GET /api/inventory/kardex
   * Consulta movimientos del Kardex paginados y filtrados (SP_Inventario_ConsultarKardex).
   */
  async getKardex(
    filters: KardexFilters = {}
  ): Promise<PaginatedData<KardexMovement>> {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<Record<string, unknown>>>
    >(API_ENDPOINTS.INVENTORY.KARDEX, { params: filters });
    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items) ? rawPaginated.items : [];
    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeKardexMovement(item)),
    };
  },

  /**
   * POST /api/inventory/adjustments
   * Registra un ajuste manual de inventario con motivo obligatorio e impide existencias negativas (SP_Inventario_RegistrarAjuste).
   */
  async registerAdjustment(
    payload: InventoryAdjustmentPayload
  ): Promise<KardexMovement> {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.INVENTORY.ADJUSTMENTS,
      payload
    );
    return normalizeKardexMovement(data.data ?? {});
  },

  /**
   * POST /api/inventory/reservations
   * Reserva existencia de una variante puntual por 15 minutos (SP_Inventario_ReservarExistencia).
   */
  async reserveVariant(payload: {
    idVariante: number;
    cantidad: number;
    tokenSesion?: string;
  }): Promise<CartReservationData> {
    const { data } = await apiClient.post<ApiResponse<CartReservationData>>(
      API_ENDPOINTS.INVENTORY.RESERVATIONS,
      {
        ...payload,
        tokenSesion: payload.tokenSesion ?? getOrCreateGuestToken(),
      }
    );
    return data.data;
  },

  /**
   * POST /api/inventory/reservations/cart
   * Reserva todas las variantes del carrito activo durante 15 minutos al iniciar el checkout (SP_Inventario_ReservarCarritoCheckout).
   */
  async reserveCartForCheckout(
    idCarrito: number,
    tokenSesion?: string
  ): Promise<CartReservationData> {
    const { data } = await apiClient.post<
      ApiResponse<CartReservationData | Array<Record<string, unknown>>>
    >(API_ENDPOINTS.INVENTORY.RESERVE_CART, {
      idCarrito,
      tokenSesion: tokenSesion ?? getOrCreateGuestToken(),
    });

    const defaultTtlMs = 15 * 60 * 1000;
    const payload = data.data;

    if (Array.isArray(payload)) {
      const first = payload[0] ?? {};
      const rawCreated =
        (first.FechaCreacion as string | undefined) ??
        (first.fechaCreacion as string | undefined);
      const rawExpires =
        (first.FechaExpiracion as string | undefined) ??
        (first.fechaExpiracion as string | undefined);

      let durationMs = defaultTtlMs;
      if (rawCreated && rawExpires) {
        const diff = Date.parse(rawExpires) - Date.parse(rawCreated);
        if (!Number.isNaN(diff) && diff > 0) {
          durationMs = diff;
        }
      }

      return {
        idCarrito,
        reservasCreadas: payload.length,
        fechaExpiracion: new Date(Date.now() + durationMs).toISOString(),
      };
    }

    // Si viene como objeto, verificar que fechaExpiracion esté en el futuro respecto al reloj del navegador
    const rawExp = payload?.fechaExpiracion
      ? Date.parse(payload.fechaExpiracion)
      : Number.NaN;
    const safeExpirationIso =
      !Number.isNaN(rawExp) && rawExp > Date.now() + 30_000
        ? payload.fechaExpiracion
        : new Date(Date.now() + defaultTtlMs).toISOString();

    return {
      ...payload,
      idCarrito: payload?.idCarrito ?? idCarrito,
      fechaExpiracion: safeExpirationIso,
    };
  },

  /**
   * POST /api/inventory/reservations/release
   * Libera manualmente reservas temporales de existencia (SP_Inventario_LiberarReserva).
   */
  async releaseReservation(payload?: {
    idReserva?: number;
    tokenSesion?: string;
  }): Promise<void> {
    await apiClient.post(API_ENDPOINTS.INVENTORY.RELEASE_RESERVATION, {
      idReserva: payload?.idReserva,
      tokenSesion: payload?.tokenSesion ?? getOrCreateGuestToken(),
    });
  },

  /**
   * POST /api/inventory/reservations/release-expired
   * Barre y libera reservas cuyo TTL de 15 minutos ha expirado (SP_Inventario_LiberarReservasExpiradas - Operador/Admin).
   */
  async releaseExpiredReservations(): Promise<{ reservasLiberadas: number }> {
    const { data } = await apiClient.post<
      ApiResponse<Record<string, unknown>>
    >(API_ENDPOINTS.INVENTORY.RELEASE_EXPIRED, {});
    const raw = data.data ?? {};
    return {
      reservasLiberadas: Number(
        raw.reservasLiberadas ?? raw.ReservasExpiradasLiberadas ?? 0
      ),
    };
  },
};

export default inventoryService;
