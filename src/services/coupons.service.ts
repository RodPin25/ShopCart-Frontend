import { apiClient, getOrCreateGuestToken, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  Coupon,
  CouponFilters,
  CouponPayload,
  CouponValidationData,
  PaginatedData,
  ValidateCouponPayload,
} from '../types';

/**
 * Servicio modular de Cupones y Promociones (RF-05).
 */
export const couponsService = {
  /**
   * POST /api/coupons/validate
   * Valida y calcula el descuento de un cupón sobre el carrito activo (SP_Cupones_ValidarYAplicarEnCarrito).
   * Rechaza con mensaje específico si venció, agotó usos o no cumple el monto mínimo.
   */
  async validateCoupon(
    payload: ValidateCouponPayload
  ): Promise<CouponValidationData> {
    const tokenInvitado = payload.tokenInvitado ?? getOrCreateGuestToken();
    const { data } = await apiClient.post<ApiResponse<CouponValidationData>>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      {
        codigo: payload.codigo.trim().toUpperCase(),
        tokenInvitado,
      }
    );
    return data.data;
  },

  /**
   * GET /api/coupons
   * Lista cupones con paginación y filtros (SP_Cupones_Listar - Solo Admin).
   */
  async listCoupons(
    filters: CouponFilters = {}
  ): Promise<PaginatedData<Coupon>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Coupon>>>(
      API_ENDPOINTS.COUPONS.BASE,
      { params: filters }
    );
    return data.data;
  },

  /**
   * GET /api/coupons/{idCupon}
   * Obtiene el detalle de un cupón y su historial de usos (SP_Cupones_ObtenerPorID - Solo Admin).
   */
  async getCouponById(idCupon: number): Promise<Coupon> {
    const { data } = await apiClient.get<
      ApiResponse<{ cupon?: Coupon } & Partial<Coupon>>
    >(API_ENDPOINTS.COUPONS.BY_ID(idCupon));
    return (data.data.cupon ?? (data.data as unknown as Coupon));
  },

  /**
   * POST /api/coupons
   * Crea un cupón de descuento por porcentaje o monto fijo (SP_Cupones_Crear - Solo Admin).
   */
  async createCoupon(payload: CouponPayload): Promise<Coupon> {
    const { data } = await apiClient.post<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.BASE,
      payload
    );
    return data.data;
  },

  /**
   * PUT /api/coupons/{idCupon}
   * Actualiza un cupón existente (SP_Cupones_Actualizar - Solo Admin).
   */
  async updateCoupon(idCupon: number, payload: CouponPayload): Promise<Coupon> {
    const { data } = await apiClient.put<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.BY_ID(idCupon),
      payload
    );
    return data.data;
  },

  /**
   * PATCH /api/coupons/{idCupon}/status
   * Activa o desactiva un cupón (SP_Cupones_CambiarEstadoActivo - Solo Admin).
   */
  async changeCouponStatus(idCupon: number, activo: boolean): Promise<Coupon> {
    const { data } = await apiClient.patch<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.STATUS(idCupon),
      { activo }
    );
    return data.data;
  },
};

export default couponsService;
