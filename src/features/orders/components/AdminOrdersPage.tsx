import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Minus,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getApiErrorMessage } from '../../../config/api';
import {
  ALLOWED_ORDER_TRANSITIONS,
  formatGTQ,
  ORDER_STATUS,
  RETURN_STATUS,
  type OrderStatus,
  type ReturnStatus,
} from '../../../config/constants';
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
import { useAdminOrders } from '../hooks/useAdminOrders';
import { getMaxReturnableQuantity } from '../hooks/useCustomerOrders';
import { OrderLifecycleBar, OrderStatusBadge } from './OrderLifecycleBar';

type AdminOrdersTab = 'pedidos' | 'devoluciones';

/**
 * Vista Operativa de Pedidos y Devoluciones (`/admin/pedidos` — RF-07 y RF-08).
 * Accesible para `Operador` y `Administrador`.
 */
export function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<AdminOrdersTab>('pedidos');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    orders,
    ordersTotalRegistros,
    ordersTotalPaginas,
    ordersPage,
    ordersPageSize,
    setOrdersPage,
    estadoPedido,
    setEstadoPedido,
    idCliente,
    setIdCliente,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    resetOrderFilters,
    isLoadingOrders,
    isErrorOrders,
    errorOrders,
    isEmptyOrders,
    refetchOrders,

    selectedOrderId,
    setSelectedOrderId,
    selectedOrderDetail,
    isLoadingSelectedOrder,

    returnsList,
    returnsTotalRegistros,
    returnsTotalPaginas,
    returnsPage,
    returnsPageSize,
    setReturnsPage,
    estadoDevolucion,
    setEstadoDevolucion,
    isLoadingReturns,
    isErrorReturns,
    errorReturns,
    isEmptyReturns,
    refetchReturns,

    selectedReturnId,
    setSelectedReturnId,
    selectedReturnDetail,
    isLoadingSelectedReturn,

    changeOrderStatus,
    isChangingStatus,
    createReturn,
    isCreatingReturn,
    resolveReturn,
    isResolvingReturn,
  } = useAdminOrders();

  const [nextOrderStatus, setNextOrderStatus] = useState<OrderStatus | ''>('');
  const [statusReason, setStatusReason] = useState<string>('');

  // Estado para devolución asistida por Operador
  const [operatorReturnQtys, setOperatorReturnQtys] = useState<Record<number, number>>({});
  const [operatorReturnReason, setOperatorReturnReason] = useState<string>('');

  // Estado para resolución de devolución
  const [resolutionObservation, setResolutionObservation] = useState<string>('');

  const handleOpenOrderDetail = (idPedido: number, currentStatus: OrderStatus) => {
    setFeedback(null);
    setSelectedOrderId(idPedido);
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] ?? [];
    setNextOrderStatus(allowed[0] ?? '');
    setStatusReason('');
    setOperatorReturnQtys({});
    setOperatorReturnReason('');
  };

  const handleTransitionOrder = async () => {
    if (!selectedOrderId || !nextOrderStatus) return;
    setFeedback(null);
    try {
      await changeOrderStatus({
        idPedido: selectedOrderId,
        payload: {
          estadoNuevo: nextOrderStatus,
          motivo: statusReason.trim() || `Avance operativo a ${nextOrderStatus}`,
        },
      });
      setFeedback({
        type: 'success',
        message: `Pedido #${selectedOrderId} actualizado al estado ${nextOrderStatus}.`,
      });
      setSelectedOrderId(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleCreateOperatorReturn = async () => {
    if (!selectedOrderId) return;
    setFeedback(null);

    const itemsToReturn = Object.entries(operatorReturnQtys)
      .filter(([, qty]) => qty > 0)
      .map(([idVariante, cantidad]) => ({
        idVariante: Number(idVariante),
        cantidad,
      }));

    if (itemsToReturn.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Selecciona al menos 1 unidad para registrar la devolución.',
      });
      return;
    }

    if (operatorReturnReason.trim().length < 5) {
      setFeedback({
        type: 'error',
        message: 'El motivo de la devolución es obligatorio (mínimo 5 caracteres).',
      });
      return;
    }

    try {
      await createReturn({
        idPedido: selectedOrderId,
        motivo: operatorReturnReason.trim(),
        items: itemsToReturn,
      });
      setFeedback({
        type: 'success',
        message: `Devolución registrada para el Pedido #${selectedOrderId}.`,
      });
      setSelectedOrderId(null);
      setActiveTab('devoluciones');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleResolveReturn = async (nuevoEstado: 'APROBADA' | 'RECHAZADA') => {
    if (!selectedReturnId) return;
    setFeedback(null);

    try {
      await resolveReturn({
        idDevolucion: selectedReturnId,
        payload: {
          nuevoEstado,
          observacion:
            resolutionObservation.trim() ||
            (nuevoEstado === 'APROBADA'
              ? 'Devolución aprobada y reintegrada al Kardex'
              : 'Devolución rechazada tras revisión'),
        },
      });
      setFeedback({
        type: 'success',
        message: `Devolución #${selectedReturnId} marcada como ${nuevoEstado}.`,
      });
      setSelectedReturnId(null);
      setResolutionObservation('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const currentOrderHeader = selectedOrderDetail?.pedido;
  const allowedNextStatuses = currentOrderHeader
    ? ALLOWED_ORDER_TRANSITIONS[currentOrderHeader.EstadoPedido] ?? []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
            Gestión Operativa de Pedidos y Devoluciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Avanza estados del ciclo de vida y procesa devoluciones totales o parciales por línea (RF-07)
          </p>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Pestañas: Pedidos vs Devoluciones */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2D4A]">
        <button
          type="button"
          onClick={() => setActiveTab('pedidos')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'pedidos'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Pedidos ({ordersTotalRegistros})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('devoluciones')}
          className={clsx(
            'px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2',
            activeTab === 'devoluciones'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
          )}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Devoluciones ({returnsTotalRegistros})</span>
        </button>
      </div>

      {/* PESTAÑA 1: LISTADO Y FILTROS SERVER-SIDE DE PEDIDOS (RF-07, RF-08) */}
      {activeTab === 'pedidos' && (
        <div className="space-y-5">
          <Card accent="blue" className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <Select
                label="Estado del pedido"
                value={estadoPedido ?? ''}
                onChange={(e) =>
                  setEstadoPedido(e.target.value ? (e.target.value as OrderStatus) : undefined)
                }
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: ORDER_STATUS.PENDIENTE, label: 'Pendiente' },
                  { value: ORDER_STATUS.PAGADO, label: 'Pagado' },
                  { value: ORDER_STATUS.EN_PREPARACION, label: 'En preparación' },
                  { value: ORDER_STATUS.ENVIADO, label: 'Enviado / Despachado' },
                  { value: ORDER_STATUS.ENTREGADO, label: 'Entregado' },
                  { value: ORDER_STATUS.CANCELADO, label: 'Cancelado' },
                ]}
              />

              <Input
                label="ID Cliente"
                type="number"
                min={1}
                placeholder="Todos"
                value={idCliente ?? ''}
                onChange={(e) =>
                  setIdCliente(e.target.value ? Number(e.target.value) : undefined)
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

              <Button variant="secondary" onClick={resetOrderFilters}>
                Limpiar filtros
              </Button>
            </div>
          </Card>

          {isLoadingOrders ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando listado de pedidos..." />
            </Card>
          ) : isErrorOrders ? (
            <ErrorState
              message={errorOrders ?? 'No fue posible consultar los pedidos.'}
              onRetry={() => void refetchOrders()}
            />
          ) : isEmptyOrders ? (
            <EmptyState
              title="No se encontraron pedidos con esos filtros"
              description="Ajusta el rango de fechas, estado o cliente."
            />
          ) : (
            <Card noPadding className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                      <th className="py-3.5 px-4">Pedido</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4">Total (GTQ)</th>
                      <th className="py-3.5 px-4 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                    {orders.map((ord) => (
                      <tr
                        key={ord.IDPedido}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0A2259] dark:text-white">
                          #{ord.IDPedido}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0A2259] dark:text-white">
                            {ord.NombreCliente ?? `Cliente #${ord.IDUsuario}`}
                          </div>
                          {ord.CorreoCliente && (
                            <div className="text-xs text-slate-400">{ord.CorreoCliente}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(ord.FechaPedido).toLocaleString('es-GT')}
                        </td>
                        <td className="py-3.5 px-4">
                          <OrderStatusBadge status={ord.EstadoPedido} />
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#0A2259] dark:text-white">
                          {formatGTQ(ord.Total)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenOrderDetail(ord.IDPedido, ord.EstadoPedido)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Gestionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4">
                <Pagination
                  currentPage={ordersPage}
                  totalPages={ordersTotalPaginas}
                  totalItems={ordersTotalRegistros}
                  pageSize={ordersPageSize}
                  onPageChange={setOrdersPage}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* PESTAÑA 2: DEVOLUCIONES Y REINTEGROS AL KARDEX (RF-07) */}
      {activeTab === 'devoluciones' && (
        <div className="space-y-5">
          <Card accent="red" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Al aprobar una devolución, las unidades devueltas se reintegran automáticamente al
              Kardex de inventario y se descuentan de los reportes de ventas.
            </div>
            <div className="w-full sm:w-64 shrink-0">
              <Select
                value={estadoDevolucion ?? ''}
                onChange={(e) =>
                  setEstadoDevolucion(
                    e.target.value ? (e.target.value as ReturnStatus) : undefined,
                  )
                }
                options={[
                  { value: '', label: 'Todas las devoluciones' },
                  { value: RETURN_STATUS.SOLICITADA, label: 'Pendientes (SOLICITADA)' },
                  { value: RETURN_STATUS.APROBADA, label: 'Aprobadas' },
                  { value: RETURN_STATUS.RECHAZADA, label: 'Rechazadas' },
                ]}
              />
            </div>
          </Card>

          {isLoadingReturns ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando devoluciones..." />
            </Card>
          ) : isErrorReturns ? (
            <ErrorState
              message={errorReturns ?? 'Error al cargar las devoluciones.'}
              onRetry={() => void refetchReturns()}
            />
          ) : isEmptyReturns ? (
            <EmptyState
              title="Sin solicitudes de devolución"
              description="No existen devoluciones registradas con el filtro actual."
            />
          ) : (
            <Card noPadding className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                      <th className="py-3.5 px-4">ID Dev.</th>
                      <th className="py-3.5 px-4">Pedido</th>
                      <th className="py-3.5 px-4">Motivo Solicitud</th>
                      <th className="py-3.5 px-4">Monto Reembolso</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                    {returnsList.map((ret) => (
                      <tr key={ret.IDDevolucion}>
                        <td className="py-3.5 px-4 font-mono font-bold">#{ret.IDDevolucion}</td>
                        <td className="py-3.5 px-4 font-mono">Pedido #{ret.IDPedido}</td>
                        <td className="py-3.5 px-4 max-w-xs truncate" title={ret.MotivoSolicitud}>
                          {ret.MotivoSolicitud}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#0A2259] dark:text-white">
                          {formatGTQ(ret.MontoTotalDevuelto)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              ret.EstadoDevolucion === RETURN_STATUS.APROBADA
                                ? 'success'
                                : ret.EstadoDevolucion === RETURN_STATUS.RECHAZADA
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {ret.EstadoDevolucion}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedReturnId(ret.IDDevolucion);
                              setResolutionObservation('');
                            }}
                          >
                            {ret.EstadoDevolucion === RETURN_STATUS.SOLICITADA
                              ? 'Resolver'
                              : 'Ver detalle'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4">
                <Pagination
                  currentPage={returnsPage}
                  totalPages={returnsTotalPaginas}
                  totalItems={returnsTotalRegistros}
                  pageSize={returnsPageSize}
                  onPageChange={setReturnsPage}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modal Operativo de Gestión de Pedido (Transición de Estado y Devolución por Línea) */}
      <Modal
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        size="xl"
        title={`Gestión Operativa — Pedido #${selectedOrderId ?? ''}`}
      >
        {isLoadingSelectedOrder || !selectedOrderDetail ? (
          <div className="py-12 flex justify-center">
            <Spinner label="Cargando información completa del pedido..." />
          </div>
        ) : (
          <div className="space-y-6">
            <OrderLifecycleBar status={selectedOrderDetail.pedido.EstadoPedido} />

            {/* Sección A: Avanzar o Cancelar Pedido según ALLOWED_ORDER_TRANSITIONS */}
            {allowedNextStatuses.length > 0 && (
              <Card accent="blue" className="space-y-3 bg-slate-50/70 dark:bg-[#0D1525]">
                <h3 className="text-sm font-extrabold text-[#0A2259] dark:text-white">
                  Avanzar o Cambiar Estado del Pedido
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <Select
                    label="Nuevo estado permitido"
                    value={nextOrderStatus}
                    onChange={(e) => setNextOrderStatus(e.target.value as OrderStatus)}
                    options={allowedNextStatuses.map((st) => ({
                      value: st,
                      label: st,
                    }))}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Motivo / Observación (registrado en bitácora)"
                      placeholder="Ej. Pedido empacado y entregado a mensajería"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isChangingStatus}
                    onClick={() => void handleTransitionOrder()}
                  >
                    Aplicar cambio de estado
                  </Button>
                </div>
              </Card>
            )}

            {/* Tabla de Líneas y Control de Devolución Operativa con bloqueo de cantidad */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#0A2259] dark:text-white">
                Líneas del Pedido (Validación de Cantidad para Devolución RF-07)
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-[#1E2D4A] rounded-xl">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase">
                      <th className="py-2.5 px-3">Variante / SKU</th>
                      <th className="py-2.5 px-3">Precio Congelado</th>
                      <th className="py-2.5 px-3">Vendidas</th>
                      <th className="py-2.5 px-3">Devueltas</th>
                      {selectedOrderDetail.pedido.EstadoPedido === ORDER_STATUS.ENTREGADO && (
                        <th className="py-2.5 px-3 text-right">Cant. a Devolver</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A]">
                    {(selectedOrderDetail.detalles ?? []).map((line) => {
                      const maxReturnable = getMaxReturnableQuantity(line);
                      const currentReturnQty = operatorReturnQtys[line.IDVariante] ?? 0;

                      return (
                        <tr key={line.IDPedidoDetalle}>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#0A2259] dark:text-white">
                              {line.NombreProducto} — {line.NombreVariante}
                            </div>
                            <div className="font-mono text-xs text-slate-400">SKU: {line.SKU}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            {formatGTQ(line.PrecioUnitarioCongelado)}
                          </td>
                          <td className="py-2.5 px-3 font-bold">{line.Cantidad}</td>
                          <td className="py-2.5 px-3">{line.CantidadDevuelta ?? 0}</td>
                          {selectedOrderDetail.pedido.EstadoPedido === ORDER_STATUS.ENTREGADO && (
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center rounded-full border border-slate-300 dark:border-[#1E2D4A] p-0.5">
                                <button
                                  type="button"
                                  disabled={currentReturnQty <= 0}
                                  onClick={() =>
                                    setOperatorReturnQtys((prev) => ({
                                      ...prev,
                                      [line.IDVariante]: Math.max(0, currentReturnQty - 1),
                                    }))
                                  }
                                  className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-35 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center font-bold text-xs">
                                  {currentReturnQty}
                                </span>
                                <button
                                  type="button"
                                  disabled={currentReturnQty >= maxReturnable}
                                  onClick={() =>
                                    setOperatorReturnQtys((prev) => ({
                                      ...prev,
                                      [line.IDVariante]: Math.min(
                                        maxReturnable,
                                        currentReturnQty + 1,
                                      ),
                                    }))
                                  }
                                  className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                                  title={`Máximo permitido: ${maxReturnable}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedOrderDetail.pedido.EstadoPedido === ORDER_STATUS.ENTREGADO && (
                <div className="pt-2 flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <Input
                      label="Motivo de devolución (para registrar devolución desde operaciones)"
                      placeholder="Ej. Producto con empaque dañado reportado por cliente"
                      value={operatorReturnReason}
                      onChange={(e) => setOperatorReturnReason(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isCreatingReturn}
                    onClick={() => void handleCreateOperatorReturn()}
                  >
                    Registrar devolución
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Detalle y Resolución de Devolución */}
      <Modal
        isOpen={selectedReturnId !== null}
        onClose={() => setSelectedReturnId(null)}
        size="lg"
        title={`Detalle de Devolución #${selectedReturnId ?? ''}`}
      >
        {isLoadingSelectedReturn || !selectedReturnDetail ? (
          <div className="py-12 flex justify-center">
            <Spinner label="Cargando líneas de la devolución..." />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Pedido asociado:</span>
                <strong>#{selectedReturnDetail.devolucion.IDPedido}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado actual:</span>
                <Badge variant="navy">{selectedReturnDetail.devolucion.EstadoDevolucion}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motivo del cliente:</span>
                <strong>{selectedReturnDetail.devolucion.MotivoSolicitud}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-[#1E2D4A] text-sm font-extrabold">
                <span>Monto total a reembolsar:</span>
                <span className="text-[#E31E24]">
                  {formatGTQ(selectedReturnDetail.devolucion.MontoTotalDevuelto)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Unidades incluidas en la devolución
              </h4>
              {(selectedReturnDetail.detalles ?? []).map((item) => (
                <div
                  key={item.IDDevolucionDetalle}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-[#0A2259] dark:text-white">
                      {item.NombreProducto} — {item.NombreVariante}
                    </p>
                    <p className="font-mono text-slate-400">SKU: {item.SKU}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block">{item.CantidadDevuelta} uds.</span>
                    <span className="text-slate-500">{formatGTQ(item.SubtotalReembolso)}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedReturnDetail.devolucion.EstadoDevolucion === RETURN_STATUS.SOLICITADA && (
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
                <Input
                  label="Observación de resolución"
                  placeholder="Ingresa el dictamen de revisión física"
                  value={resolutionObservation}
                  onChange={(e) => setResolutionObservation(e.target.value)}
                />
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isResolvingReturn}
                    onClick={() => void handleResolveReturn('RECHAZADA')}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Rechazar devolución
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isResolvingReturn}
                    onClick={() => void handleResolveReturn('APROBADA')}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Aprobar y reintegrar al Kardex
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
