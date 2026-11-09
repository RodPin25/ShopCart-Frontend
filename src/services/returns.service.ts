import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  PaginatedData,
  RequestReturnPayload,
  ResolveReturnPayload,
  ReturnDetailData,
  ReturnFilters,
  ReturnHeader,
} from '../types';

/**
 * Servicio modular de Devoluciones Totales o Parciales por Línea (RF-07).
 */
export const returnsService = {
  /**
   * GET /api/returns
   * Lista devoluciones paginadas con filtro por estado, pedido o cliente (SP_Devoluciones_Listar).
   */
  async listReturns(
    filters: ReturnFilters = {}
  ): Promise<PaginatedData<ReturnHeader>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<ReturnHeader>>>(
      API_ENDPOINTS.RETURNS.BASE,
      { params: filters }
    );
    return data.data;
  },

  /**
   * POST /api/returns
   * Solicita una devolución total o parcial por línea de un pedido entregado (SP_Devoluciones_Solicitar).
   */
  async requestReturn(payload: RequestReturnPayload): Promise<ReturnDetailData> {
    const { data } = await apiClient.post<ApiResponse<ReturnDetailData>>(
      API_ENDPOINTS.RETURNS.BASE,
      payload
    );
    return data.data;
  },

  /**
   * GET /api/returns/{idDevolucion}
   * Obtiene el encabezado y las líneas de detalle de una devolución (SP_Devoluciones_ObtenerDetalle).
   */
  async getReturnById(idDevolucion: number): Promise<ReturnDetailData> {
    const { data } = await apiClient.get<ApiResponse<ReturnDetailData>>(
      API_ENDPOINTS.RETURNS.BY_ID(idDevolucion)
    );
    return data.data;
  },

  /**
   * PATCH /api/returns/{idDevolucion}/resolve
   * Aprueba o rechaza una devolución con reintegro automático al Kardex al aprobarse (SP_Devoluciones_Resolver - Operador/Admin).
   */
  async resolveReturn(
    idDevolucion: number,
    payload: ResolveReturnPayload
  ): Promise<ReturnDetailData> {
    const { data } = await apiClient.patch<ApiResponse<ReturnDetailData>>(
      API_ENDPOINTS.RETURNS.RESOLVE(idDevolucion),
      payload
    );
    return data.data;
  },
};

export default returnsService;
