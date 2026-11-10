import { apiClient, getOrCreateGuestToken, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  Coupon,
  CouponDetailData,
  CouponFilters,
  CouponPayload,
  CouponUsageItem,
  CouponValidationData,
  DiscountType,
  PaginatedData,
  ValidateCouponPayload,
} from '../types';

function normalizeCoupon(raw: Record<string, unknown>): Coupon {
  const limiteTotal = Number(raw.LimiteUsosTotal ?? 0);
  const usosActuales = Number(raw.UsosActuales ?? 0);
  const fechaInicio = String(raw.FechaInicio ?? new Date().toISOString());
  const fechaFin = String(raw.FechaFin ?? new Date().toISOString());
  const activo = Boolean(raw.Activo ?? true);

  const nowMs = Date.now();
  const isDateValid =
    Date.parse(fechaInicio) <= nowMs && Date.parse(fechaFin) >= nowMs;
  const computedVigente =
    raw.Vigente !== undefined
      ? Boolean(raw.Vigente)
      : raw.EstaVigente !== undefined
        ? Boolean(raw.EstaVigente)
        : activo && isDateValid && usosActuales < limiteTotal;

  return {
    IDCupon: Number(raw.IDCupon ?? 0),
    Codigo: String(raw.Codigo ?? ''),
    TipoDescuento:
      ((raw.TipoDescuento as DiscountType | undefined) ?? 'PORCENTAJE'),
    ValorDescuento: Number(raw.ValorDescuento ?? 0),
    MontoMinimoCompra: Number(raw.MontoMinimoCompra ?? 0),
    IDCategoria:
      raw.IDCategoria !== undefined && raw.IDCategoria !== null
        ? Number(raw.IDCategoria)
        : null,
    NombreCategoria:
      (raw.NombreCategoria as string | null | undefined) ?? null,
    FechaInicio: fechaInicio,
    FechaFin: fechaFin,
    LimiteUsosTotal: limiteTotal,
    UsosActuales: usosActuales,
    UsosRestantes:
      raw.UsosRestantes !== undefined
        ? Number(raw.UsosRestantes)
        : Math.max(0, limiteTotal - usosActuales),
    LimiteUsosPorCliente:
      raw.LimiteUsosPorCliente !== undefined && raw.LimiteUsosPorCliente !== null
        ? Number(raw.LimiteUsosPorCliente)
        : 1,
    Activo: activo,
    Vigente: computedVigente,
  };
}

function normalizeCouponUsage(raw: Record<string, unknown>): CouponUsageItem {
  return {
    IDCuponUso: Number(raw.IDCuponUso ?? 0),
    IDCupon: Number(raw.IDCupon ?? 0),
    IDUsuario: Number(raw.IDUsuario ?? 0),
    NombreCliente: String(raw.NombreCliente ?? ''),
    CorreoCliente: String(raw.CorreoCliente ?? ''),
    IDPedido: Number(raw.IDPedido ?? 0),
    SubtotalPedido: Number(raw.SubtotalPedido ?? 0),
    MontoDescuento: Number(raw.MontoDescuento ?? 0),
    TotalPedido: Number(raw.TotalPedido ?? 0),
    FechaUso: String(raw.FechaUso ?? new Date().toISOString()),
  };
}

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
    payload: ValidateCouponPayload,
  ): Promise<CouponValidationData> {
    const tokenInvitado = payload.tokenInvitado ?? getOrCreateGuestToken();
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      {
        codigo: payload.codigo.trim().toUpperCase(),
        tokenInvitado,
      },
    );

    const raw = data.data ?? {};
    return {
      valido: Boolean(raw.valido ?? raw.EsValido),
      mensaje: String(
        raw.mensaje ?? raw.MensajeValidacion ?? 'Validación de cupón completada.',
      ),
      idCupon: raw.idCupon !== undefined ? Number(raw.idCupon) : raw.IDCupon !== undefined ? Number(raw.IDCupon) : undefined,
      codigo: (raw.codigo as string | undefined) ?? (raw.Codigo as string | undefined),
      tipoDescuento:
        ((raw.tipoDescuento ?? raw.TipoDescuento) as DiscountType | undefined) ?? undefined,
      valorDescuento:
        raw.valorDescuento !== undefined
          ? Number(raw.valorDescuento)
          : raw.ValorDescuento !== undefined
            ? Number(raw.ValorDescuento)
            : undefined,
      subtotalCarrito: Number(raw.subtotalCarrito ?? raw.SubtotalCarrito ?? 0),
      montoDescuento: Number(raw.montoDescuento ?? raw.MontoDescuento ?? 0),
      nuevoTotal: Number(raw.nuevoTotal ?? raw.TotalConDescuento ?? 0),
    };
  },

  /**
   * GET /api/coupons
   * Lista cupones con paginación y filtros (SP_Cupones_Listar - Solo Admin).
   */
  async listCoupons(
    filters: CouponFilters = {},
  ): Promise<PaginatedData<Coupon>> {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<Record<string, unknown>>>
    >(API_ENDPOINTS.COUPONS.BASE, { params: filters });
    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items) ? rawPaginated.items : [];
    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeCoupon(item)),
    };
  },

  /**
   * GET /api/coupons/{idCupon}
   * Obtiene el detalle de un cupón y su historial de usos (SP_Cupones_ObtenerPorID - Solo Admin).
   */
  async getCouponById(idCupon: number): Promise<Coupon> {
    const detail = await this.getCouponDetail(idCupon);
    return detail.cupon;
  },

  /**
   * GET /api/coupons/{idCupon}
   * Obtiene el cupón junto con su historial de usos por cliente y pedido (`SP_Cupones_ObtenerPorID`).
   */
  async getCouponDetail(idCupon: number): Promise<CouponDetailData> {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.COUPONS.BY_ID(idCupon),
    );
    const raw = data.data ?? {};
    const rawCupon =
      raw.cupon && typeof raw.cupon === 'object'
        ? (raw.cupon as Record<string, unknown>)
        : raw;
    const rawUsages = Array.isArray(raw.historialUsos) ? raw.historialUsos : [];

    return {
      cupon: normalizeCoupon(rawCupon),
      historialUsos: rawUsages.map((u) =>
        normalizeCouponUsage(u as Record<string, unknown>),
      ),
    };
  },

  /**
   * POST /api/coupons
   * Crea un cupón de descuento por porcentaje o monto fijo (SP_Cupones_Crear - Solo Admin).
   */
  async createCoupon(payload: CouponPayload): Promise<Coupon> {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.COUPONS.BASE,
      payload,
    );
    return normalizeCoupon(data.data ?? {});
  },

  /**
   * PUT /api/coupons/{idCupon}
   * Actualiza un cupón existente (SP_Cupones_Actualizar - Solo Admin).
   */
  async updateCoupon(idCupon: number, payload: CouponPayload): Promise<Coupon> {
    const { data } = await apiClient.put<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.COUPONS.BY_ID(idCupon),
      payload,
    );
    return normalizeCoupon(data.data ?? {});
  },

  /**
   * PATCH /api/coupons/{idCupon}/status
   * Activa o desactiva un cupón (SP_Cupones_CambiarEstadoActivo - Solo Admin).
   */
  async changeCouponStatus(idCupon: number, activo: boolean): Promise<Coupon> {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.COUPONS.STATUS(idCupon),
      { activo },
    );
    return normalizeCoupon(data.data ?? {});
  },
};

export default couponsService;
