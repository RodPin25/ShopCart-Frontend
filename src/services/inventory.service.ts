import { apiClient, getOrCreateGuestToken, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  CartReservationData,
  InventoryAdjustmentPayload,
  KardexFilters,
  KardexMovement,
  PaginatedData,
  StockFilters,
  StockItem,
} from '../types';

/**
 * Servicio modular de Inventario, Kardex, Ajustes Manuales y Reservas Temporales de 15 min (RF-03 & RF-06).
 */
export const inventoryService = {
  /**
   * GET /api/inventory/stock
   * Lista existencias físicas, reservadas, disponibles y su conciliación contra el Kardex (SP_Inventario_ListarExistencias).
   */
  async listStock(filters: StockFilters = {}): Promise<PaginatedData<StockItem>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<StockItem>>>(
      API_ENDPOINTS.INVENTORY.STOCK,
      { params: filters }
    );
    return data.data;
  },

  /**
   * GET /api/inventory/kardex
   * Consulta movimientos del Kardex paginados y filtrados (SP_Inventario_ConsultarKardex).
   */
  async getKardex(
    filters: KardexFilters = {}
  ): Promise<PaginatedData<KardexMovement>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<KardexMovement>>>(
      API_ENDPOINTS.INVENTORY.KARDEX,
      { params: filters }
    );
    return data.data;
  },

  /**
   * POST /api/inventory/adjustments
   * Registra un ajuste manual de inventario con motivo obligatorio e impide existencias negativas (SP_Inventario_RegistrarAjuste).
   */
  async registerAdjustment(
    payload: InventoryAdjustmentPayload
  ): Promise<KardexMovement> {
    const { data } = await apiClient.post<ApiResponse<KardexMovement>>(
      API_ENDPOINTS.INVENTORY.ADJUSTMENTS,
      payload
    );
    return data.data;
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
    const { data } = await apiClient.post<ApiResponse<CartReservationData>>(
      API_ENDPOINTS.INVENTORY.RESERVE_CART,
      {
        idCarrito,
        tokenSesion: tokenSesion ?? getOrCreateGuestToken(),
      }
    );
    return data.data;
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
  async releaseExpiredReservations(): Promise<{ reservasLiberadas?: number }> {
    const { data } = await apiClient.post<
      ApiResponse<{ reservasLiberadas?: number }>
    >(API_ENDPOINTS.INVENTORY.RELEASE_EXPIRED);
    return data.data;
  },
};

export default inventoryService;
