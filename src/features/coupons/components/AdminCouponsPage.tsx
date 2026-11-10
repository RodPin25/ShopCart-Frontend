import { useState } from 'react';
import {
  Calendar,
  Edit3,
  History,
  Plus,
  Power,
  Search,
  TicketPercent,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getApiErrorMessage } from '../../../config/api';
import { formatGTQ } from '../../../config/constants';
import { couponSchema } from '../../../config/schemas';
import { useDisclosure } from '../../../hooks';
import {
  Alert,
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
import { useAdminCoupons } from '../hooks/useAdminCoupons';
import type { Coupon, DiscountType } from '../types';

function toDateTimeLocalValue(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function getDefaultDates(): { start: string; end: string } {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    start: toDateTimeLocalValue(now.toISOString()),
    end: toDateTimeLocalValue(nextMonth.toISOString()),
  };
}

/**
 * Vista Administrativa de Cupones y Promociones (`/admin/cupones` — RF-05).
 * Exclusiva para rol `Administrador`.
 */
export function AdminCouponsPage() {
  const {
    categories,
    coupons,
    totalRegistros,
    totalPaginas,
    currentPage,
    pageSize,
    setPage,
    busqueda,
    setBusqueda,
    tipoDescuento,
    setTipoDescuento,
    activo,
    setActivo,
    soloVigentes,
    setSoloVigentes,
    resetFilters,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,

    selectedCouponIdForHistory,
    setSelectedCouponIdForHistory,
    selectedCouponDetail,
    isLoadingCouponDetail,

    createCoupon,
    isCreating,
    updateCoupon,
    isUpdating,
    toggleCouponStatus,
    isTogglingStatus,
  } = useAdminCoupons();

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Estado del Modal de Crear / Editar Cupón
  const formModal = useDisclosure();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formCodigo, setFormCodigo] = useState<string>('');
  const [formTipoDescuento, setFormTipoDescuento] = useState<DiscountType>('PORCENTAJE');
  const [formValorDescuento, setFormValorDescuento] = useState<number>(10);
  const [formMontoMinimo, setFormMontoMinimo] = useState<number>(0);
  const [formIdCategoria, setFormIdCategoria] = useState<string>('');
  const [formFechaInicio, setFormFechaInicio] = useState<string>('');
  const [formFechaFin, setFormFechaFin] = useState<string>('');
  const [formLimiteTotal, setFormLimiteTotal] = useState<number>(100);
  const [formLimitePorCliente, setFormLimitePorCliente] = useState<number>(1);
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    const defaults = getDefaultDates();
    setEditingCoupon(null);
    setFormCodigo('');
    setFormTipoDescuento('PORCENTAJE');
    setFormValorDescuento(10);
    setFormMontoMinimo(100);
    setFormIdCategoria('');
    setFormFechaInicio(defaults.start);
    setFormFechaFin(defaults.end);
    setFormLimiteTotal(100);
    setFormLimitePorCliente(1);
    setFormActivo(true);
    setFormError(null);
    formModal.open();
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCodigo(coupon.Codigo);
    setFormTipoDescuento(coupon.TipoDescuento);
    setFormValorDescuento(coupon.ValorDescuento);
    setFormMontoMinimo(coupon.MontoMinimoCompra);
    setFormIdCategoria(coupon.IDCategoria ? String(coupon.IDCategoria) : '');
    setFormFechaInicio(toDateTimeLocalValue(coupon.FechaInicio));
    setFormFechaFin(toDateTimeLocalValue(coupon.FechaFin));
    setFormLimiteTotal(coupon.LimiteUsosTotal);
    setFormLimitePorCliente(coupon.LimiteUsosPorCliente ?? 1);
    setFormActivo(coupon.Activo);
    setFormError(null);
    formModal.open();
  };

  const handleSubmitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = couponSchema.safeParse({
      codigo: formCodigo,
      tipoDescuento: formTipoDescuento,
      valorDescuento: Number(formValorDescuento),
      montoMinimoCompra: Number(formMontoMinimo),
      idCategoria: formIdCategoria ? Number(formIdCategoria) : null,
      fechaInicio: formFechaInicio,
      fechaFin: formFechaFin,
      limiteUsosTotal: Number(formLimiteTotal),
      limiteUsosPorCliente: Number(formLimitePorCliente),
      activo: formActivo,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setFormError(firstIssue?.message ?? 'Revisa los campos del formulario.');
      return;
    }

    const payload = {
      codigo: parsed.data.codigo,
      tipoDescuento: parsed.data.tipoDescuento,
      valorDescuento: parsed.data.valorDescuento,
      montoMinimoCompra: parsed.data.montoMinimoCompra,
      idCategoria: parsed.data.idCategoria ?? null,
      fechaInicio: new Date(parsed.data.fechaInicio).toISOString(),
      fechaFin: new Date(parsed.data.fechaFin).toISOString(),
      limiteUsosTotal: parsed.data.limiteUsosTotal,
      limiteUsosPorCliente: parsed.data.limiteUsosPorCliente,
      activo: parsed.data.activo,
    };

    try {
      if (editingCoupon) {
        await updateCoupon({
          idCupon: editingCoupon.IDCupon,
          payload,
        });
        setFeedback({
          type: 'success',
          message: `Cupón ${payload.codigo} actualizado correctamente.`,
        });
      } else {
        await createCoupon(payload);
        setFeedback({
          type: 'success',
          message: `Cupón promocional ${payload.codigo} creado exitosamente.`,
        });
      }
      formModal.close();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setFeedback(null);
    try {
      await toggleCouponStatus({
        idCupon: coupon.IDCupon,
        nextActivo: !coupon.Activo,
      });
      setFeedback({
        type: 'success',
        message: `El cupón ${coupon.Codigo} fue ${
          !coupon.Activo ? 'activado' : 'desactivado'
        } correctamente.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
            Cupones y Promociones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configura descuentos por porcentaje o monto fijo en GTQ, vigencia, mínimo de compra y
            límites de redención (RF-05)
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nuevo cupón promocional
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Filtros Server-Side */}
      <Card accent="red" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input
            label="Buscar por código"
            placeholder="Ej. BIENVENIDA, RINO10..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            label="Tipo de descuento"
            value={tipoDescuento ?? ''}
            onChange={(e) =>
              setTipoDescuento(
                e.target.value ? (e.target.value as DiscountType) : undefined,
              )
            }
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'PORCENTAJE', label: 'Porcentaje (%)' },
              { value: 'MONTO_FIJO', label: 'Monto fijo (GTQ)' },
            ]}
          />

          <Select
            label="Estado administrativo"
            value={activo === undefined ? '' : String(activo)}
            onChange={(e) =>
              setActivo(e.target.value === '' ? undefined : e.target.value === 'true')
            }
            options={[
              { value: '', label: 'Activos e inactivos' },
              { value: 'true', label: 'Solo activos' },
              { value: 'false', label: 'Solo inactivos' },
            ]}
          />

          <div className="pb-2">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0A2259] dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloVigentes}
                onChange={(e) => setSoloVigentes(e.target.checked)}
                className="w-4 h-4 rounded accent-[#E31E24]"
              />
              <span>Solo vigentes hoy (con usos disponibles)</span>
            </label>
          </div>

          <Button variant="secondary" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Tabla de Cupones */}
      {isLoading ? (
        <Card className="py-12 flex justify-center">
          <Spinner label="Cargando cupones promocionales..." />
        </Card>
      ) : isError ? (
        <ErrorState
          message={error ?? 'No se pudieron consultar los cupones.'}
          onRetry={() => void refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          title="No se encontraron cupones promocionales"
          description="Crea un nuevo cupón o limpia los filtros de búsqueda."
          action={
            <Button variant="primary" onClick={handleOpenCreateModal}>
              Crear primer cupón
            </Button>
          }
        />
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                  <th className="py-3.5 px-4">Código / Alcance</th>
                  <th className="py-3.5 px-4">Beneficio</th>
                  <th className="py-3.5 px-4">Mínimo Compra</th>
                  <th className="py-3.5 px-4">Vigencia</th>
                  <th className="py-3.5 px-4">Redenciones</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                {(coupons ?? []).map((coupon) => {
                  const usagePercent = Math.min(
                    100,
                    Math.round(
                      (coupon.UsosActuales / Math.max(1, coupon.LimiteUsosTotal)) * 100,
                    ),
                  );

                  return (
                    <tr
                      key={coupon.IDCupon}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-[#0A2259]/10 dark:bg-white/10 text-[#0A2259] dark:text-white border border-[#0A2259]/20 dark:border-white/15">
                            {coupon.Codigo}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {coupon.NombreCategoria
                            ? `Categoría: ${coupon.NombreCategoria}`
                            : 'Aplica a todo el catálogo'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#E31E24] text-base">
                          {coupon.TipoDescuento === 'PORCENTAJE'
                            ? `${coupon.ValorDescuento}% OFF`
                            : `- ${formatGTQ(coupon.ValorDescuento)}`}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase">
                          {coupon.TipoDescuento}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#0A2259] dark:text-white">
                        {coupon.MontoMinimoCompra > 0
                          ? formatGTQ(coupon.MontoMinimoCompra)
                          : 'Sin mínimo (Q 0.00)'}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-[#E31E24] shrink-0" />
                          <span>{new Date(coupon.FechaInicio).toLocaleDateString('es-GT')}</span>
                          <span>→</span>
                          <span>{new Date(coupon.FechaFin).toLocaleDateString('es-GT')}</span>
                        </div>
                        <div className="mt-1">
                          {coupon.Vigente ? (
                            <Badge variant="success">Vigente hoy</Badge>
                          ) : (
                            <Badge variant="warning">No vigente / Vencido</Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>
                            {coupon.UsosActuales} / {coupon.LimiteUsosTotal} usos
                          </span>
                          <span className="text-slate-400">
                            Máx {coupon.LimiteUsosPorCliente ?? 1}/cliente
                          </span>
                        </div>
                        <div className="w-36 h-1.5 rounded-full bg-slate-200 dark:bg-[#1E2D4A] overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all',
                              usagePercent >= 100 ? 'bg-[#E31E24]' : 'bg-emerald-500',
                            )}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={coupon.Activo ? 'success' : 'danger'}>
                          {coupon.Activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCouponIdForHistory(coupon.IDCupon)}
                            title="Ver historial de redenciones"
                            leftIcon={<History className="w-3.5 h-3.5" />}
                          >
                            Usos
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditModal(coupon)}
                            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant={coupon.Activo ? 'danger' : 'primary'}
                            size="sm"
                            isLoading={isTogglingStatus}
                            onClick={() => void handleToggleActive(coupon)}
                            leftIcon={<Power className="w-3.5 h-3.5" />}
                          >
                            {coupon.Activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modal de Crear / Editar Cupón Promocional (RF-05) */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        size="lg"
        title={
          editingCoupon
            ? `Editar Cupón — ${editingCoupon.Codigo}`
            : 'Crear Nuevo Cupón Promocional'
        }
      >
        <form onSubmit={(e) => void handleSubmitCoupon(e)} className="space-y-4">
          {formError && (
            <Alert variant="error" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código Promocional (único, sin espacios)"
              placeholder="Ej. RINO25"
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
              leftIcon={<TicketPercent className="w-4 h-4" />}
              required
            />

            <Select
              label="Tipo de Descuento"
              value={formTipoDescuento}
              onChange={(e) => setFormTipoDescuento(e.target.value as DiscountType)}
              options={[
                { value: 'PORCENTAJE', label: 'PORCENTAJE (%)' },
                { value: 'MONTO_FIJO', label: 'MONTO_FIJO (Quetzales Q)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={
                formTipoDescuento === 'PORCENTAJE'
                  ? 'Porcentaje de descuento (1 - 100%)'
                  : 'Monto de descuento en GTQ (Q)'
              }
              type="number"
              step="0.01"
              min={0.01}
              max={formTipoDescuento === 'PORCENTAJE' ? 100 : undefined}
              value={formValorDescuento}
              onChange={(e) => setFormValorDescuento(Number(e.target.value))}
              required
            />

            <Input
              label="Monto mínimo de compra (GTQ)"
              type="number"
              step="0.01"
              min={0}
              value={formMontoMinimo}
              onChange={(e) => setFormMontoMinimo(Number(e.target.value))}
              required
            />

            <Select
              label="Categoría aplicable (opcional)"
              value={formIdCategoria}
              onChange={(e) => setFormIdCategoria(e.target.value)}
              options={[
                { value: '', label: 'Todo el catálogo' },
                ...(categories ?? []).map((cat) => ({
                  value: String(cat.IDCategoria),
                  label: cat.NombreCategoria,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha y hora de inicio de vigencia"
              type="datetime-local"
              value={formFechaInicio}
              onChange={(e) => setFormFechaInicio(e.target.value)}
              required
            />

            <Input
              label="Fecha y hora de fin de vigencia"
              type="datetime-local"
              value={formFechaFin}
              onChange={(e) => setFormFechaFin(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Límite total de usos (global)"
              type="number"
              min={1}
              step={1}
              value={formLimiteTotal}
              onChange={(e) => setFormLimiteTotal(Math.max(1, Number(e.target.value) || 1))}
              required
            />

            <Input
              label="Límite de usos por cliente"
              type="number"
              min={1}
              step={1}
              value={formLimitePorCliente}
              onChange={(e) =>
                setFormLimitePorCliente(Math.max(1, Number(e.target.value) || 1))
              }
              required
            />
          </div>

          {editingCoupon && (
            <label className="inline-flex items-center gap-2.5 text-sm font-bold text-[#0A2259] dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formActivo}
                onChange={(e) => setFormActivo(e.target.checked)}
                className="w-4 h-4 rounded accent-[#E31E24]"
              />
              <span>Cupón activo para redención en tienda</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button type="button" variant="ghost" onClick={formModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating || isUpdating}
            >
              {editingCoupon ? 'Guardar cambios' : 'Crear cupón'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Historial de Usos por Cliente y Pedido (SP_Cupones_ObtenerPorID) */}
      <Modal
        isOpen={selectedCouponIdForHistory !== null}
        onClose={() => setSelectedCouponIdForHistory(null)}
        size="lg"
        title={`Historial de Redenciones — ${selectedCouponDetail?.cupon.Codigo ?? ''}`}
      >
        {isLoadingCouponDetail || !selectedCouponDetail ? (
          <div className="py-12 flex justify-center">
            <Spinner label="Cargando historial de usos del cupón..." />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-slate-400 block">Redenciones registradas</span>
                <strong className="text-base font-mono text-[#0A2259] dark:text-white">
                  {selectedCouponDetail.cupon.UsosActuales} /{' '}
                  {selectedCouponDetail.cupon.LimiteUsosTotal}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Usos restantes</span>
                <strong className="text-base font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedCouponDetail.cupon.UsosRestantes ?? 0}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Máximo por cliente</span>
                <strong className="text-base font-mono text-[#E31E24]">
                  {selectedCouponDetail.cupon.LimiteUsosPorCliente ?? 1}
                </strong>
              </div>
            </div>

            {(selectedCouponDetail.historialUsos ?? []).length === 0 ? (
              <EmptyState
                title="Este cupón aún no ha sido utilizado en ningún pedido"
                description="Las redenciones aparecerán aquí en cuanto un cliente confirme un checkout con este código."
              />
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-[#1E2D4A] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] font-extrabold uppercase">
                      <th className="py-2.5 px-3">Pedido</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Fecha Uso</th>
                      <th className="py-2.5 px-3 text-right">Descuento</th>
                      <th className="py-2.5 px-3 text-right">Total Pedido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A]">
                    {(selectedCouponDetail.historialUsos ?? []).map((usage) => (
                      <tr key={usage.IDCuponUso}>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          #{usage.IDPedido}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#0A2259] dark:text-white">
                            {usage.NombreCliente}
                          </div>
                          <div className="text-slate-400">{usage.CorreoCliente}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(usage.FechaUso).toLocaleString('es-GT')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          - {formatGTQ(usage.MontoDescuento)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-[#0A2259] dark:text-white">
                          {formatGTQ(usage.TotalPedido)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
