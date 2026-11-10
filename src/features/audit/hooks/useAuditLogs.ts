import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { usePagination } from '../../../hooks';
import { auditService } from '../api/audit.api';
import type { AuditAction, AuditLogItem, AuditModule } from '../types';

export const ADMIN_AUDIT_LOGS_QUERY_KEY = ['admin', 'audit-logs'] as const;

/**
 * Custom Hook para la Bitácora Inmutable de Auditoría (RF-09 — Solo Administrador):
 * - Modo estrictamente de solo lectura (sin mutaciones de edición ni eliminación).
 * - Paginación y filtros server-side por módulo, acción (`CREAR`, `MODIFICAR`, `DESACTIVAR`), ID de usuario y rango de fechas.
 */
export function useAuditLogs() {
  const pagination = usePagination({ initialPage: 1, initialPageSize: 15 });

  const [modulo, setModulo] = useState<AuditModule | ''>('');
  const [accion, setAccion] = useState<AuditAction | ''>('');
  const [idUsuario, setIdUsuario] = useState<number | undefined>(undefined);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filters = {
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    modulo: modulo || undefined,
    accion: accion || undefined,
    idUsuario,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  };

  const auditQuery = useQuery({
    queryKey: [...ADMIN_AUDIT_LOGS_QUERY_KEY, filters],
    queryFn: () => auditService.getAuditLogs(filters),
  });

  const logs: AuditLogItem[] = auditQuery.data?.items ?? [];

  return {
    logs,
    totalRegistros: auditQuery.data?.totalRegistros ?? 0,
    totalPaginas: auditQuery.data?.totalPaginas ?? 1,
    currentPage: pagination.numeroPagina,
    pageSize: pagination.tamanoPagina,
    setPage: pagination.setPage,

    modulo,
    setModulo: (val: AuditModule | '') => {
      setModulo(val);
      pagination.resetPage();
    },
    accion,
    setAccion: (val: AuditAction | '') => {
      setAccion(val);
      pagination.resetPage();
    },
    idUsuario,
    setIdUsuario: (val: number | undefined) => {
      setIdUsuario(val);
      pagination.resetPage();
    },
    fechaInicio,
    setFechaInicio: (val: string) => {
      setFechaInicio(val);
      pagination.resetPage();
    },
    fechaFin,
    setFechaFin: (val: string) => {
      setFechaFin(val);
      pagination.resetPage();
    },
    resetFilters: () => {
      setModulo('');
      setAccion('');
      setIdUsuario(undefined);
      setFechaInicio('');
      setFechaFin('');
      pagination.resetPage();
    },

    selectedLog,
    setSelectedLog,

    isLoading: auditQuery.isLoading,
    isError: auditQuery.isError,
    error: auditQuery.error ? getApiErrorMessage(auditQuery.error) : null,
    isEmpty: !auditQuery.isLoading && !auditQuery.isError && logs.length === 0,
    refetch: auditQuery.refetch,
  };
}
