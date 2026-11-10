import { Eye, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../../config/constants';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
} from '../../../components';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { AuditAction, AuditModule } from '../types';

function getActionBadgeVariant(accion: string): 'success' | 'blue' | 'danger' | 'navy' {
  switch (accion.toUpperCase()) {
    case 'CREAR':
      return 'success';
    case 'MODIFICAR':
      return 'blue';
    case 'DESACTIVAR':
      return 'danger';
    default:
      return 'navy';
  }
}

function formatAuditPayload(raw: string | null | undefined): string {
  if (!raw || raw.trim().length === 0) {
    return '— (Sin valor previo registrado) —';
  }
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/**
 * Vista de Bitácora Inmutable de Auditoría (`/admin/auditoria` — RF-09).
 * Exclusiva para rol `Administrador`. Estrictamente de solo lectura (sin controles de edición ni eliminación).
 */
export function AdminAuditPage() {
  const {
    logs,
    totalRegistros,
    totalPaginas,
    currentPage,
    pageSize,
    setPage,
    modulo,
    setModulo,
    accion,
    setAccion,
    idUsuario,
    setIdUsuario,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    resetFilters,
    selectedLog,
    setSelectedLog,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,
  } = useAuditLogs();

  return (
    <div className="space-y-6">
      {/* Encabezado de Bitácora Inmutable */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
              Bitácora Inmutable de Auditoría
            </h1>
            <Badge variant="navy">
              <Lock className="w-3 h-3 mr-1 inline" />
              Solo Lectura (RF-09)
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro histórico inalterable de operaciones administrativas con trazabilidad de{' '}
            <code className="font-mono text-xs">ValorAnterior</code> y{' '}
            <code className="font-mono text-xs">ValorNuevo</code>
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          leftIcon={<RefreshCw className="w-4 h-4 text-[#E31E24]" />}
        >
          Actualizar bitácora
        </Button>
      </div>

      {/* Filtros Server-Side (SP_Auditoria_ConsultarBitacora) */}
      <Card accent="navy" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <Select
            label="Módulo auditable"
            value={modulo}
            onChange={(e) => setModulo(e.target.value as AuditModule | '')}
            options={[
              { value: '', label: 'Todos los módulos' },
              ...AUDIT_MODULES.map((mod) => ({
                value: mod,
                label: mod,
              })),
            ]}
          />

          <Select
            label="Acción ejecutada"
            value={accion}
            onChange={(e) => setAccion(e.target.value as AuditAction | '')}
            options={[
              { value: '', label: 'Todas las acciones' },
              ...AUDIT_ACTIONS.map((act) => ({
                value: act,
                label: act,
              })),
            ]}
          />

          <Input
            label="ID Usuario"
            type="number"
            min={1}
            placeholder="Todos"
            value={idUsuario ?? ''}
            onChange={(e) =>
              setIdUsuario(e.target.value ? Number(e.target.value) : undefined)
            }
          />

          <Input
            label="Fecha desde"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />

          <Input
            label="Fecha hasta"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />

          <Button variant="secondary" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Tabla Inmutable de Eventos Auditados */}
      {isLoading ? (
        <Card className="py-12 flex justify-center">
          <Spinner label="Consultando bitácora inmutable de auditoría..." />
        </Card>
      ) : isError ? (
        <ErrorState
          message={error ?? 'No fue posible consultar los registros de auditoría.'}
          onRetry={() => void refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          title="No se encontraron eventos de auditoría con estos filtros"
          description="Ajusta el módulo, acción, usuario o rango de fechas seleccionado."
        />
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                  <th className="py-3.5 px-4">ID / Fecha y Hora</th>
                  <th className="py-3.5 px-4">Módulo</th>
                  <th className="py-3.5 px-4">Acción</th>
                  <th className="py-3.5 px-4">Registro Afectado</th>
                  <th className="py-3.5 px-4">Usuario Responsable</th>
                  <th className="py-3.5 px-4">Vista Previa del Cambio</th>
                  <th className="py-3.5 px-4 text-right">Inspección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                {(logs ?? []).map((log) => (
                  <tr
                    key={log.IDBitacora}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#0A2259] dark:text-white">
                        #{log.IDBitacora}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(log.FechaEvento).toLocaleString('es-GT')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B111E] text-[#0A2259] dark:text-slate-200 border border-slate-200 dark:border-[#1E2D4A]">
                        {log.Modulo}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadgeVariant(log.Accion)}>
                        {log.Accion}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#E31E24]">
                      #{log.IDRegistroEntidad}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0A2259] dark:text-white">
                        {log.NombreUsuario ?? `Usuario #${log.IDUsuario ?? 'N/A'}`}
                      </div>
                      <div className="text-xs text-slate-400">
                        {log.CorreoUsuario ? `${log.CorreoUsuario}` : ''}
                        {log.RolUsuario ? ` (${log.RolUsuario})` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                        {log.ValorNuevo ?? 'Sin detalle'}
                      </div>
                      {log.ValorAnterior && (
                        <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                          Ant: {log.ValorAnterior}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Comparar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPaginas}
              totalItems={totalRegistros}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* Modal Comparador Lado a Lado: ValorAnterior vs ValorNuevo (RF-09) */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        size="xl"
        title={
          selectedLog
            ? `Inspección de Auditoría #${selectedLog.IDBitacora} — ${selectedLog.Modulo} (${selectedLog.Accion})`
            : 'Inspección de Auditoría'
        }
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Metadatos del evento */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Fecha y Hora</span>
                <strong className="text-[#0A2259] dark:text-white">
                  {new Date(selectedLog.FechaEvento).toLocaleString('es-GT')}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Módulo / Acción</span>
                <strong className="text-[#0A2259] dark:text-white">
                  {selectedLog.Modulo} · {selectedLog.Accion}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">ID Registro Afectado</span>
                <strong className="font-mono text-[#E31E24]">
                  #{selectedLog.IDRegistroEntidad}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Ejecutado por</span>
                <strong className="text-[#0A2259] dark:text-white">
                  {selectedLog.NombreUsuario ?? `ID #${selectedLog.IDUsuario ?? 'Sistema'}`}
                </strong>
              </div>
            </div>

            {/* Comparador Visual Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Valor Anterior (Antes del Cambio)
                  </span>
                  <Badge variant="warning">Estado Previo</Badge>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200 max-h-80 overflow-y-auto p-3 rounded-lg bg-white/80 dark:bg-[#0B111E] border border-slate-200 dark:border-[#1E2D4A]">
                  {formatAuditPayload(selectedLog.ValorAnterior)}
                </pre>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Valor Nuevo (Después del Cambio)
                  </span>
                  <Badge variant="success">Estado Aplicado</Badge>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200 max-h-80 overflow-y-auto p-3 rounded-lg bg-white/80 dark:bg-[#0B111E] border border-slate-200 dark:border-[#1E2D4A]">
                  {formatAuditPayload(selectedLog.ValorNuevo)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1E2D4A] text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#E31E24]" />
                Registro criptográfica y transaccionalmente inmutable en SQL Server (RF-09)
              </span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Cerrar comparador
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
