import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type { AuditFilters, AuditLogItem, PaginatedData } from '../types';

/**
 * Servicio modular de Bitácora Inmutable de Auditoría (RF-09 - Solo Admin).
 * Estricto modo de solo lectura (sin endpoints ni métodos de edición o borrado).
 */
export const auditService = {
  /**
   * GET /api/audit
   * Consulta registros de bitácora paginados con filtros por módulo, acción, usuario y fechas (SP_Auditoria_ConsultarBitacora).
   */
  async getAuditLogs(
    filters: AuditFilters = {}
  ): Promise<PaginatedData<AuditLogItem>> {
    // Limpiar strings vacíos para no enviar ?modulo=&accion=
    const cleanParams: Record<string, unknown> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const { data } = await apiClient.get<ApiResponse<PaginatedData<AuditLogItem>>>(
      API_ENDPOINTS.AUDIT.BASE,
      { params: cleanParams }
    );
    return data.data;
  },
};

export default auditService;
