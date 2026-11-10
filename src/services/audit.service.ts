import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type { AuditFilters, AuditLogItem, PaginatedData } from '../types';

function normalizeAuditLogItem(raw: Record<string, unknown>): AuditLogItem {
  const modulo = String(raw.Modulo ?? 'SISTEMA');
  return {
    IDBitacora: Number(raw.IDBitacora ?? 0),
    Modulo: modulo,
    Entidad: String(raw.Entidad ?? modulo),
    IDRegistroEntidad: String(
      raw.IDRegistroEntidad ?? raw.IDRegistroAfectado ?? '',
    ),
    Accion: String(raw.Accion ?? 'MODIFICAR'),
    ValorAnterior:
      raw.ValorAnterior !== undefined && raw.ValorAnterior !== null
        ? String(raw.ValorAnterior)
        : null,
    ValorNuevo:
      raw.ValorNuevo !== undefined && raw.ValorNuevo !== null
        ? String(raw.ValorNuevo)
        : null,
    IDUsuario:
      raw.IDUsuario !== undefined && raw.IDUsuario !== null
        ? Number(raw.IDUsuario)
        : null,
    NombreUsuario:
      (raw.NombreUsuario as string | null | undefined) ?? 'Sistema',
    CorreoUsuario: (raw.CorreoUsuario as string | null | undefined) ?? null,
    RolUsuario: (raw.RolUsuario as string | null | undefined) ?? null,
    DireccionIP: (raw.DireccionIP as string | null | undefined) ?? null,
    FechaEvento: String(
      raw.FechaEvento ?? raw.FechaHora ?? new Date().toISOString(),
    ),
  };
}

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
    filters: AuditFilters = {},
  ): Promise<PaginatedData<AuditLogItem>> {
    // Limpiar strings vacíos para no enviar ?modulo=&accion=
    const cleanParams: Record<string, unknown> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<Record<string, unknown>>>
    >(API_ENDPOINTS.AUDIT.BASE, { params: cleanParams });

    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items)
      ? rawPaginated.items
      : [];

    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeAuditLogItem(item)),
    };
  },
};

export default auditService;
