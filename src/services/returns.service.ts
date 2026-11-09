import type { ReturnStatus } from '../config/constants';
import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  PaginatedData,
  RequestReturnPayload,
  ResolveReturnPayload,
  ReturnDetailData,
  ReturnFilters,
  ReturnHeader,
  ReturnLineItem,
} from '../types';

function normalizeReturnHeader(raw: Record<string, unknown>): ReturnHeader {
  return {
    IDDevolucion: Number(raw.IDDevolucion ?? 0),
    IDPedido: Number(raw.IDPedido ?? 0),
    IDUsuarioSolicita: Number(raw.IDUsuarioSolicita ?? raw.IDCliente ?? 0),
    NombreCliente: (raw.NombreCliente as string | undefined) ?? undefined,
    EstadoDevolucion:
      ((raw.EstadoDevolucion ?? raw.Estado) as ReturnStatus | undefined) ?? 'SOLICITADA',
    MotivoSolicitud: String(raw.MotivoSolicitud ?? raw.Motivo ?? ''),
    ObservacionResolucion:
      (raw.ObservacionResolucion as string | null | undefined) ??
      (raw.Observacion as string | null | undefined) ??
      null,
    MontoTotalDevuelto: Number(
      raw.MontoTotalDevuelto ?? raw.MontoReintegroConIVA ?? 0,
    ),
    FechaSolicitud: String(raw.FechaSolicitud ?? new Date().toISOString()),
    FechaResolucion: (raw.FechaResolucion as string | null | undefined) ?? null,
  };
}

function normalizeReturnLine(raw: Record<string, unknown>): ReturnLineItem {
  return {
    IDDevolucionDetalle: Number(raw.IDDevolucionDetalle ?? 0),
    IDDevolucion: Number(raw.IDDevolucion ?? 0),
    IDVariante: Number(raw.IDVariante ?? 0),
    SKU: String(raw.SKU ?? ''),
    NombreVariante: String(raw.NombreVariante ?? ''),
    NombreProducto: String(raw.NombreProducto ?? ''),
    CantidadDevuelta: Number(raw.CantidadDevuelta ?? 0),
    PrecioUnitarioReembolso: Number(
      raw.PrecioUnitarioReembolso ?? raw.PrecioUnitarioCongelado ?? 0,
    ),
    SubtotalReembolso: Number(raw.SubtotalReembolso ?? raw.MontoLineaDevuelta ?? 0),
  };
}

function normalizeReturnDetail(raw: Record<string, unknown>): ReturnDetailData {
  const rawHeader =
    raw.devolucion && typeof raw.devolucion === 'object'
      ? (raw.devolucion as Record<string, unknown>)
      : raw;

  const rawLines = Array.isArray(raw.detalles)
    ? raw.detalles
    : Array.isArray(raw.lineas)
      ? raw.lineas
      : [];

  return {
    devolucion: normalizeReturnHeader(rawHeader),
    detalles: rawLines.map((item) => normalizeReturnLine(item as Record<string, unknown>)),
  };
}

/**
 * Servicio modular de Devoluciones Totales o Parciales por Línea (RF-07).
 */
export const returnsService = {
  /**
   * GET /api/returns
   * Lista devoluciones paginadas con filtro por estado, pedido o cliente (SP_Devoluciones_Listar).
   */
  async listReturns(
    filters: ReturnFilters = {},
  ): Promise<PaginatedData<ReturnHeader>> {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<Record<string, unknown>>>
    >(API_ENDPOINTS.RETURNS.BASE, { params: filters });

    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items) ? rawPaginated.items : [];
    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeReturnHeader(item)),
    };
  },

  /**
   * POST /api/returns
   * Solicita una devolución total o parcial por línea de un pedido entregado (SP_Devoluciones_Solicitar).
   */
  async requestReturn(payload: RequestReturnPayload): Promise<ReturnDetailData> {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.RETURNS.BASE,
      payload,
    );
    return normalizeReturnDetail(data.data ?? {});
  },

  /**
   * GET /api/returns/{idDevolucion}
   * Obtiene el encabezado y las líneas de detalle de una devolución (SP_Devoluciones_ObtenerDetalle).
   */
  async getReturnById(idDevolucion: number): Promise<ReturnDetailData> {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.RETURNS.BY_ID(idDevolucion),
    );
    return normalizeReturnDetail(data.data ?? {});
  },

  /**
   * PATCH /api/returns/{idDevolucion}/resolve
   * Aprueba o rechaza una devolución con reintegro automático al Kardex al aprobarse (SP_Devoluciones_Resolver - Operador/Admin).
   */
  async resolveReturn(
    idDevolucion: number,
    payload: ResolveReturnPayload,
  ): Promise<ReturnDetailData> {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.RETURNS.RESOLVE(idDevolucion),
      payload,
    );
    return normalizeReturnDetail(data.data ?? {});
  },
};

export default returnsService;
