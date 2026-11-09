import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  History,
  PlusCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getApiErrorMessage } from '../../../config/api';
import { formatGTQ } from '../../../config/constants';
import { inventoryAdjustmentSchema } from '../../../config/schemas';
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
import { useInventory } from '../hooks/useInventory';
import type { KardexMovementType, StockItem } from '../types';

type InventoryTab = 'existencias' | 'kardex';

function getMovementBadgeVariant(
  tipo: KardexMovementType,
): 'success' | 'warning' | 'danger' | 'blue' | 'navy' {
  switch (tipo) {
    case 'AJUSTE_ENTRADA':
      return 'success';
    case 'DEVOLUCION':
      return 'blue';
    case 'AJUSTE_SALIDA':
      return 'warning';
    case 'VENTA':
      return 'navy';
    default:
      return 'navy';
  }
}

function isPositiveMovement(tipo: KardexMovementType): boolean {
  return tipo === 'AJUSTE_ENTRADA' || tipo === 'DEVOLUCION';
}

/**
 * Vista Operativa de Inventario en Tiempo Real y Libro Mayor de Kardex (`/admin/inventario` — RF-03).
 * Accesible para `Operador` y `Administrador`.
 */
export function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('existencias');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    categories,
    stockItems,
    stockTotalRegistros,
    stockTotalPaginas,
    stockPage,
    stockPageSize,
    setStockPage,
    busqueda,
    setBusqueda,
    idCategoria,
    setIdCategoria,
    soloBajoStock,
    setSoloBajoStock,
    umbralBajoStock,
    setUmbralBajoStock,
    resetStockFilters,
    isLoadingStock,
    isErrorStock,
    errorStock,
    isEmptyStock,
    refetchStock,

    kardexItems,
    kardexTotalRegistros,
    kardexTotalPaginas,
    kardexPage,
    kardexPageSize,
    setKardexPage,
    kardexIdVariante,
    setKardexIdVariante,
    kardexIdProducto,
    setKardexIdProducto,
    kardexTipoMovimiento,
    setKardexTipoMovimiento,
    kardexFechaInicio,
    setKardexFechaInicio,
    kardexFechaFin,
    setKardexFechaFin,
    resetKardexFilters,
    isLoadingKardex,
    isErrorKardex,
    errorKardex,
    isEmptyKardex,
    refetchKardex,

    registerAdjustment,
    isRegisteringAdjustment,
    releaseExpiredReservations,
    isReleasingExpired,
  } = useInventory();

  // Estado del Modal de Ajuste Manual de Inventario (RF-03)
  const adjustmentModal = useDisclosure();
  const [selectedVariantForAdjustment, setSelectedVariantForAdjustment] =
    useState<StockItem | null>(null);
  const [manualVariantIdInput, setManualVariantIdInput] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA'>(
    'AJUSTE_ENTRADA',
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenAdjustmentModal = (stockRow?: StockItem) => {
    setModalError(null);
    if (stockRow) {
      setSelectedVariantForAdjustment(stockRow);
      setManualVariantIdInput(String(stockRow.IDVariante));
    } else {
      const firstRow = stockItems[0] ?? null;
      setSelectedVariantForAdjustment(firstRow);
      setManualVariantIdInput(firstRow ? String(firstRow.IDVariante) : '');
    }
    setAdjustmentType('AJUSTE_ENTRADA');
    setAdjustmentQuantity(1);
    setAdjustmentReason('');
    adjustmentModal.open();
  };

  const handleInspectVariantKardex = (idVariante: number) => {
    setKardexIdVariante(idVariante);
    setActiveTab('kardex');
  };

  const handleReleaseExpired = async () => {
    setFeedback(null);
    try {
      const res = await releaseExpiredReservations();
      setFeedback({
        type: 'success',
        message: `Barrido completado: ${res.reservasLiberadas} reserva(s) expirada(s) liberada(s) y reintegrada(s) al stock disponible.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  // Cálculo proyectado en tiempo real para bloquear saldos negativos (RF-03)
  const currentPhysical = selectedVariantForAdjustment?.StockFisico ?? 0;
  const currentAvailable = selectedVariantForAdjustment?.StockDisponible ?? 0;
  const signedDelta =
    adjustmentType === 'AJUSTE_ENTRADA' ? adjustmentQuantity : -adjustmentQuantity;
  const projectedPhysical = currentPhysical + signedDelta;
  const projectedAvailable = currentAvailable + signedDelta;
  const wouldResultInNegativeStock =
    selectedVariantForAdjustment !== null &&
    adjustmentType === 'AJUSTE_SALIDA' &&
    (projectedPhysical < 0 || projectedAvailable < 0);

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const resolvedVariantId = selectedVariantForAdjustment
      ? selectedVariantForAdjustment.IDVariante
      : Number(manualVariantIdInput);

    if (wouldResultInNegativeStock) {
      setModalError(
        `Operación bloqueada (RF-03): El ajuste de salida por ${adjustmentQuantity} uds. excede el stock disponible actual (${currentAvailable} uds.) y generaría existencias negativas.`,
      );
      return;
    }

    const parsed = inventoryAdjustmentSchema.safeParse({
      idVariante: resolvedVariantId,
      tipoMovimiento: adjustmentType,
      cantidad: Number(adjustmentQuantity),
      motivo: adjustmentReason,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setModalError(firstIssue?.message ?? 'Verifica los datos del ajuste.');
      return;
    }

    try {
      const movement = await registerAdjustment(parsed.data);
      adjustmentModal.close();
      setFeedback({
        type: 'success',
        message: `Ajuste registrado en Kardex (#${movement.IDMovimientoKardex}): ${parsed.data.tipoMovimiento} de ${parsed.data.cantidad} uds. Stock resultante: ${movement.SaldoNuevo}.`,
      });
    } catch (err) {
      setModalError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
            Inventario en Tiempo Real y Kardex
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control de Stock Físico, Reservado (15 min) y Disponible con conciliación contra el
            Libro Mayor de Kardex (RF-03)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isReleasingExpired}
            onClick={() => void handleReleaseExpired()}
            leftIcon={<Clock className="w-4 h-4 text-[#E31E24]" />}
          >
            Liberar reservas expiradas (15m)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAdjustmentModal()}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Registrar ajuste manual
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Pestañas: Existencias y Conciliación vs Movimientos de Kardex */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2D4A]">
        <button
          type="button"
          onClick={() => setActiveTab('existencias')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'existencias'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <Boxes className="w-4 h-4" />
          <span>Existencias y Conciliación ({stockTotalRegistros})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kardex')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'kardex'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <History className="w-4 h-4" />
          <span>Movimientos del Kardex ({kardexTotalRegistros})</span>
        </button>
      </div>

      {/* PESTAÑA 1: EXISTENCIAS FÍSICAS, RESERVADAS, DISPONIBLES Y CONCILIACIÓN KARDEX */}
      {activeTab === 'existencias' && (
        <div className="space-y-5">
          <Card accent="blue" className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <Input
                  label="Buscar por SKU, variante o producto"
                  placeholder="Ej. SKU-001, Laptop, Camisa..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <Select
                label="Categoría"
                value={idCategoria ?? ''}
                onChange={(e) =>
                  setIdCategoria(e.target.value ? Number(e.target.value) : undefined)
                }
                options={[
                  { value: '', label: 'Todas las categorías' },
                  ...(categories ?? []).map((cat) => ({
                    value: String(cat.IDCategoria),
                    label: cat.NombreCategoria,
                  })),
                ]}
              />

              <div className="flex items-center gap-3 pb-1">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0A2259] dark:text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={soloBajoStock}
                    onChange={(e) => setSoloBajoStock(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#E31E24]"
                  />
                  <span>Solo bajo stock (≤ {umbralBajoStock})</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={umbralBajoStock}
                  onChange={(e) => setUmbralBajoStock(Number(e.target.value) || 0)}
                  className="w-16 rounded-lg border border-slate-300 dark:border-[#1E2D4A] bg-white dark:bg-[#0B111E] px-2 py-1.5 text-xs font-bold text-center"
                  title="Umbral de bajo stock"
                />
              </div>

              <Button variant="secondary" onClick={resetStockFilters}>
                Limpiar filtros
              </Button>
            </div>
          </Card>

          {isLoadingStock ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Consultando existencias y conciliando Kardex..." />
            </Card>
          ) : isErrorStock ? (
            <ErrorState
              message={errorStock ?? 'Error al cargar las existencias de inventario.'}
              onRetry={() => void refetchStock()}
            />
          ) : isEmptyStock ? (
            <EmptyState
              title="No se encontraron variantes en inventario"
              description="Prueba ajustando los filtros de búsqueda, categoría o umbral de bajo stock."
            />
          ) : (
            <Card noPadding className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                      <th className="py-3.5 px-4">Variante / SKU</th>
                      <th className="py-3.5 px-4">Precio (GTQ)</th>
                      <th className="py-3.5 px-4 text-center">Stock Físico</th>
                      <th className="py-3.5 px-4 text-center">Reservado (15m)</th>
                      <th className="py-3.5 px-4 text-center">Disponible</th>
                      <th className="py-3.5 px-4 text-center">Suma Kardex</th>
                      <th className="py-3.5 px-4 text-center">Conciliación</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                    {(stockItems ?? []).map((item) => {
                      const isLow = item.StockDisponible <= umbralBajoStock;
                      return (
                        <tr
                          key={item.IDVariante}
                          className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0A2259] dark:text-white">
                              {item.NombreProducto} — {item.NombreVariante}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono font-semibold text-[#E31E24]">
                                {item.SKU}
                              </span>
                              <span>·</span>
                              <span>{item.NombreCategoria}</span>
                              <span>·</span>
                              <span>ID #{item.IDVariante}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#0A2259] dark:text-white">
                            {formatGTQ(item.Precio)}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {item.StockFisico}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.StockReservado > 0 ? (
                              <Badge variant="warning">{item.StockReservado} res.</Badge>
                            ) : (
                              <span className="text-slate-400 font-mono">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-extrabold text-xs',
                                item.StockDisponible <= 0
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                                  : isLow
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
                              )}
                            >
                              {item.StockDisponible} uds.
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                            {item.SumaKardex}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.Conciliado ? (
                              <Badge variant="success">
                                <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                                Cuadra
                              </Badge>
                            ) : (
                              <Badge variant="danger">
                                <AlertTriangle className="w-3 h-3 mr-1 inline" />
                                Descuadre
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleInspectVariantKardex(item.IDVariante)}
                                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                              >
                                Kardex
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenAdjustmentModal(item)}
                                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                              >
                                Ajustar
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
                  currentPage={stockPage}
                  totalPages={stockTotalPaginas}
                  totalItems={stockTotalRegistros}
                  pageSize={stockPageSize}
                  onPageChange={setStockPage}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* PESTAÑA 2: LIBRO MAYOR DE KARDEX (RF-03) */}
      {activeTab === 'kardex' && (
        <div className="space-y-5">
          <Card accent="navy" className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <Select
                label="Tipo de Movimiento"
                value={kardexTipoMovimiento ?? ''}
                onChange={(e) =>
                  setKardexTipoMovimiento(
                    e.target.value ? (e.target.value as KardexMovementType) : undefined,
                  )
                }
                options={[
                  { value: '', label: 'Todos los movimientos' },
                  { value: 'VENTA', label: 'VENTA' },
                  { value: 'AJUSTE_ENTRADA', label: 'AJUSTE_ENTRADA' },
                  { value: 'AJUSTE_SALIDA', label: 'AJUSTE_SALIDA' },
                  { value: 'DEVOLUCION', label: 'DEVOLUCION' },
                ]}
              />

              <Input
                label="ID Variante"
                type="number"
                min={1}
                placeholder="Todas"
                value={kardexIdVariante ?? ''}
                onChange={(e) =>
                  setKardexIdVariante(e.target.value ? Number(e.target.value) : undefined)
                }
              />

              <Input
                label="ID Producto"
                type="number"
                min={1}
                placeholder="Todos"
                value={kardexIdProducto ?? ''}
                onChange={(e) =>
                  setKardexIdProducto(e.target.value ? Number(e.target.value) : undefined)
                }
              />

              <Input
                label="Fecha desde"
                type="date"
                value={kardexFechaInicio}
                onChange={(e) => setKardexFechaInicio(e.target.value)}
              />

              <Input
                label="Fecha hasta"
                type="date"
                value={kardexFechaFin}
                onChange={(e) => setKardexFechaFin(e.target.value)}
              />

              <Button variant="secondary" onClick={resetKardexFilters}>
                Limpiar filtros
              </Button>
            </div>
          </Card>

          {isLoadingKardex ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando movimientos del Libro Mayor de Kardex..." />
            </Card>
          ) : isErrorKardex ? (
            <ErrorState
              message={errorKardex ?? 'No fue posible consultar el Kardex.'}
              onRetry={() => void refetchKardex()}
            />
          ) : isEmptyKardex ? (
            <EmptyState
              title="Sin movimientos en el Kardex para este filtro"
              description="Ajusta el rango de fechas, tipo de movimiento o variante seleccionada."
            />
          ) : (
            <Card noPadding className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                      <th className="py-3.5 px-4">ID / Fecha</th>
                      <th className="py-3.5 px-4">Movimiento</th>
                      <th className="py-3.5 px-4">Variante / SKU</th>
                      <th className="py-3.5 px-4 text-center">Stock Anterior</th>
                      <th className="py-3.5 px-4 text-center">Cantidad</th>
                      <th className="py-3.5 px-4 text-center">Stock Resultante</th>
                      <th className="py-3.5 px-4">Motivo / Ref.</th>
                      <th className="py-3.5 px-4">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                    {(kardexItems ?? []).map((mov) => {
                      const positive = isPositiveMovement(mov.TipoMovimiento);
                      return (
                        <tr
                          key={mov.IDMovimientoKardex}
                          className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-[#0A2259] dark:text-white">
                              #{mov.IDMovimientoKardex}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(mov.FechaMovimiento).toLocaleString('es-GT')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={getMovementBadgeVariant(mov.TipoMovimiento)}>
                              {mov.TipoMovimiento}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0A2259] dark:text-white">
                              {mov.NombreProducto} — {mov.NombreVariante}
                            </div>
                            <div className="font-mono text-xs text-slate-400">
                              SKU: {mov.SKU} · Var #{mov.IDVariante}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                            {mov.SaldoAnterior}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-extrabold">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1',
                                positive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-[#E31E24]',
                              )}
                            >
                              {positive ? (
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownCircle className="w-3.5 h-3.5" />
                              )}
                              {positive ? `+${mov.Cantidad}` : `-${Math.abs(mov.Cantidad)}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-extrabold text-[#0A2259] dark:text-white">
                            {mov.SaldoNuevo}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="text-xs text-slate-700 dark:text-slate-200">
                              {mov.Motivo}
                            </div>
                            {mov.IDPedidoReferencia && (
                              <span className="inline-block mt-0.5 text-[11px] font-mono font-bold text-[#E31E24]">
                                Pedido #{mov.IDPedidoReferencia}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {mov.NombreUsuario ?? `Usuario #${mov.IDUsuario}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4">
                <Pagination
                  currentPage={kardexPage}
                  totalPages={kardexTotalPaginas}
                  totalItems={kardexTotalRegistros}
                  pageSize={kardexPageSize}
                  onPageChange={setKardexPage}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Ajuste Manual de Inventario (RF-03) */}
      <Modal
        isOpen={adjustmentModal.isOpen}
        onClose={adjustmentModal.close}
        size="lg"
        title="Registrar Ajuste Manual de Inventario en Kardex"
      >
        <form onSubmit={(e) => void handleSubmitAdjustment(e)} className="space-y-4">
          {modalError && (
            <Alert variant="error" onClose={() => setModalError(null)}>
              {modalError}
            </Alert>
          )}

          {/* Selector de Variante */}
          <Select
            label="Variante a ajustar"
            value={selectedVariantForAdjustment?.IDVariante ?? manualVariantIdInput}
            onChange={(e) => {
              const id = Number(e.target.value);
              setManualVariantIdInput(e.target.value);
              const found = (stockItems ?? []).find((s) => s.IDVariante === id) ?? null;
              setSelectedVariantForAdjustment(found);
            }}
            options={[
              { value: '', label: 'Selecciona una variante del listado...' },
              ...(stockItems ?? []).map((s) => ({
                value: String(s.IDVariante),
                label: `[${s.SKU}] ${s.NombreProducto} - ${s.NombreVariante} (Físico: ${s.StockFisico} | Disp: ${s.StockDisponible})`,
              })),
            ]}
          />

          {/* Resumen de Stock Actual y Proyectado */}
          {selectedVariantForAdjustment && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div>
                <span className="text-slate-400 block">Stock Físico Actual</span>
                <strong className="text-base font-mono text-[#0A2259] dark:text-white">
                  {currentPhysical}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Reservado (15m)</span>
                <strong className="text-base font-mono text-amber-500">
                  {selectedVariantForAdjustment.StockReservado}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Disponible Actual</span>
                <strong className="text-base font-mono text-emerald-600 dark:text-emerald-400">
                  {currentAvailable}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Disponible Resultante</span>
                <strong
                  className={clsx(
                    'text-base font-mono',
                    wouldResultInNegativeStock
                      ? 'text-[#E31E24]'
                      : 'text-[#0A2259] dark:text-white',
                  )}
                >
                  {projectedAvailable}
                </strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de Ajuste Manual"
              value={adjustmentType}
              onChange={(e) =>
                setAdjustmentType(e.target.value as 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA')
              }
              options={[
                {
                  value: 'AJUSTE_ENTRADA',
                  label: 'AJUSTE_ENTRADA (+ Abastecimiento / Conteo)',
                },
                {
                  value: 'AJUSTE_SALIDA',
                  label: 'AJUSTE_SALIDA (- Merma / Daño / Conteo)',
                },
              ]}
            />

            <Input
              label="Cantidad de unidades (entero positivo)"
              type="number"
              min={1}
              step={1}
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Math.max(1, Number(e.target.value) || 1))}
              required
            />
          </div>

          {wouldResultInNegativeStock && (
            <Alert variant="error" title="Existencias negativas bloqueadas (RF-03)">
              No es posible descontar <strong>{adjustmentQuantity} unidades</strong> porque el
              stock disponible actual es de <strong>{currentAvailable} unidades</strong>.
            </Alert>
          )}

          <Input
            label="Motivo obligatorio del ajuste (registrado en Kardex y Auditoría)"
            placeholder="Ej. Recepción de lote de proveedor #402 / Baja por empaque dañado en bodega"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button type="button" variant="ghost" onClick={adjustmentModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isRegisteringAdjustment}
              disabled={wouldResultInNegativeStock || adjustmentReason.trim().length < 3}
            >
              Confirmar ajuste en Kardex
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
