import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Clock,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { getApiErrorMessage } from '../../../config/api';
import { formatGTQ } from '../../../config/constants';
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
  PageLoader,
} from '../../../components';
import { getMaxReturnableQuantity, useOrderDetail } from '../hooks/useCustomerOrders';
import { OrderLifecycleBar, OrderStatusBadge } from './OrderLifecycleBar';

export function CustomerOrderDetailPage() {
  const { idPedido } = useParams<{ idPedido: string }>();
  const numericOrderId = Number(idPedido);

  const {
    order,
    lines,
    payments,
    statusHistory,
    canCancelOrder,
    canRequestReturn,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,
    cancelOrder,
    isCancelling,
    requestReturn,
    isRequestingReturn,
  } = useOrderDetail(numericOrderId);

  const cancelModal = useDisclosure();
  const returnModal = useDisclosure();

  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (isLoading) {
    return <PageLoader label="Cargando el detalle y seguimiento del pedido..." />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          message={error ?? 'No pudimos cargar el pedido solicitado.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (isEmpty || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Pedido no encontrado"
          description="El pedido no existe o pertenece a otra cuenta."
          action={
            <Link to="/mis-pedidos">
              <Button variant="primary">Volver a mis pedidos</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleOpenReturnModal = () => {
    const initial: Record<number, number> = {};
    lines.forEach((line) => {
      initial[line.IDVariante] = 0;
    });
    setReturnQtys(initial);
    setReturnReason('');
    returnModal.open();
  };

  const handleAdjustReturnQty = (idVariante: number, nextValue: number, maxAllowed: number) => {
    // Regla RF-07: Impedir devolver más unidades que las vendidas disponibles por línea
    const clamped = Math.max(0, Math.min(maxAllowed, Math.floor(nextValue)));
    setReturnQtys((prev) => ({
      ...prev,
      [idVariante]: clamped,
    }));
  };

  const handleConfirmCancel = async () => {
    setFeedback(null);
    try {
      await cancelOrder(cancelReason);
      cancelModal.close();
      setFeedback({
        type: 'success',
        message: 'El pedido fue cancelado y las existencias fueron reintegradas al inventario.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleConfirmReturn = async () => {
    setFeedback(null);
    const selectedItems = Object.entries(returnQtys)
      .filter(([, qty]) => qty > 0)
      .map(([idVariante, cantidad]) => ({
        idVariante: Number(idVariante),
        cantidad,
      }));

    if (selectedItems.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Selecciona al menos una unidad en alguna línea para solicitar la devolución.',
      });
      return;
    }

    if (returnReason.trim().length < 5) {
      setFeedback({
        type: 'error',
        message: 'Ingresa un motivo de devolución de al menos 5 caracteres.',
      });
      return;
    }

    try {
      await requestReturn({
        idPedido: order.IDPedido,
        motivo: returnReason.trim(),
        items: selectedItems,
      });
      returnModal.close();
      setFeedback({
        type: 'success',
        message: 'Solicitud de devolución registrada exitosamente.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/mis-pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:text-[#E31E24] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a mis pedidos
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white">
              Pedido #{order.IDPedido}
            </h1>
            <OrderStatusBadge status={order.EstadoPedido} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Confirmado el {new Date(order.FechaPedido).toLocaleString('es-GT')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canCancelOrder && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => cancelModal.open()}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Cancelar pedido
            </Button>
          )}

          {canRequestReturn && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenReturnModal}
              leftIcon={<RotateCcw className="w-4 h-4 text-[#E31E24]" />}
            >
              Solicitar devolución
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Barra de Progreso del Ciclo de Vida (RF-07) */}
      <OrderLifecycleBar status={order.EstadoPedido} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Líneas con Precio Congelado e Historial de Estados */}
        <div className="lg:col-span-8 space-y-6">
          <Card accent="blue" noPadding className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white">
                Artículos del Pedido (Precios Congelados en GTQ)
              </h2>
              <Badge variant="navy">{lines.length} líneas</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                    <th className="py-3 px-4">Producto / Variante</th>
                    <th className="py-3 px-4">Precio Congelado</th>
                    <th className="py-3 px-4">Cant.</th>
                    <th className="py-3 px-4">Devuelto</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                  {lines.map((line) => (
                    <tr key={line.IDPedidoDetalle}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0A2259] dark:text-white">
                          {line.NombreProducto}
                        </div>
                        <div className="text-xs text-slate-500">
                          {line.NombreVariante} · <span className="font-mono">{line.SKU}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {formatGTQ(line.PrecioUnitarioCongelado)}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{line.Cantidad}</td>
                      <td className="py-3.5 px-4 text-xs">
                        {(line.CantidadDevuelta ?? 0) > 0 ? (
                          <Badge variant="warning">{line.CantidadDevuelta} dev.</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#0A2259] dark:text-white">
                        {formatGTQ(line.SubtotalLinea)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Trazabilidad de Cambios de Estado (RF-07) */}
          <Card accent="navy" className="space-y-4">
            <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E31E24]" />
              <span>Historial de Estados del Pedido</span>
            </h2>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400">Sin transiciones adicionales registradas.</p>
            ) : (
              <div className="space-y-3">
                {statusHistory.map((hist) => (
                  <div
                    key={hist.IDHistorialEstado}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-bold text-[#0A2259] dark:text-white">
                        <span>{hist.EstadoAnterior ?? 'CREACIÓN'}</span>
                        <span className="text-[#E31E24]">→</span>
                        <OrderStatusBadge status={hist.EstadoNuevo} />
                      </div>
                      {hist.Motivo && (
                        <p className="text-slate-500 dark:text-slate-400">Motivo: {hist.Motivo}</p>
                      )}
                    </div>
                    <div className="text-slate-400 sm:text-right">
                      <div>{new Date(hist.FechaCambio).toLocaleString('es-GT')}</div>
                      {hist.NombreUsuario && <div>Por: {hist.NombreUsuario}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Resumen Financiero, Dirección y Pagos */}
        <div className="lg:col-span-4 space-y-6">
          <Card accent="red" className="space-y-4">
            <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white">
              Resumen Financiero
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold">{formatGTQ(order.Subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Descuento {order.CodigoCupon ? `(${order.CodigoCupon})` : ''}</span>
                <span className="font-bold">- {formatGTQ(order.MontoDescuento)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA incluido (12%)</span>
                <span>{formatGTQ(order.MontoIVA)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-[#1E2D4A] text-lg font-extrabold">
                <span>Total</span>
                <span className="text-[#E31E24]">{formatGTQ(order.Total)}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#E31E24]" /> Dirección de Entrega
            </h3>
            <p className="text-sm font-bold text-[#0A2259] dark:text-white">
              {order.Municipio} {order.Departamento ? `, ${order.Departamento}` : ''}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {order.DireccionLinea ?? `Dirección ID #${order.IDDireccionEntrega}`}
            </p>
            {order.ReferenciaDireccion && (
              <p className="text-xs text-slate-400">Ref: {order.ReferenciaDireccion}</p>
            )}
          </Card>

          {payments.length > 0 && (
            <Card className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#E31E24]" /> Pago Registrado
              </h3>
              {payments.map((pay) => (
                <div key={pay.IDPago} className="text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{pay.MetodoPago}</span>
                    <span>{formatGTQ(pay.MontoPagado)}</span>
                  </div>
                  {pay.TransaccionID && (
                    <div className="font-mono text-slate-400">Ref: {pay.TransaccionID}</div>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Modal Cancelar Pedido */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={cancelModal.close}
        title={`Cancelar Pedido #${order.IDPedido}`}
        description="El pedido aún no ha sido despachado. Al cancelarlo se reintegrarán las unidades al inventario."
      >
        <div className="space-y-4">
          <Input
            label="Motivo de cancelación"
            placeholder="Ej. Ya no necesito el producto / Error al elegir dirección"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={cancelModal.close}>
              Volver
            </Button>
            <Button
              variant="danger"
              isLoading={isCancelling}
              onClick={() => void handleConfirmCancel()}
            >
              Confirmar cancelación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Solicitar Devolución Total o Parcial por Línea (RF-07) */}
      <Modal
        isOpen={returnModal.isOpen}
        onClose={returnModal.close}
        size="lg"
        title={`Solicitar devolución — Pedido #${order.IDPedido}`}
        description="Selecciona la cantidad a devolver en cada línea. No puedes devolver más unidades que las compradas disponibles."
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {lines.map((line) => {
              const maxReturnable = getMaxReturnableQuantity(line);
              const currentQty = returnQtys[line.IDVariante] ?? 0;

              return (
                <div
                  key={line.IDVariante}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0A2259] dark:text-white truncate">
                      {line.NombreProducto} — {line.NombreVariante}
                    </p>
                    <p className="text-xs text-slate-400">
                      Compradas: {line.Cantidad} · Ya devueltas: {line.CantidadDevuelta ?? 0} ·{' '}
                      <strong>Máx. devolución: {maxReturnable}</strong>
                    </p>
                  </div>

                  <div className="inline-flex items-center rounded-full border border-slate-300 dark:border-[#1E2D4A] p-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={currentQty <= 0}
                      onClick={() =>
                        handleAdjustReturnQty(line.IDVariante, currentQty - 1, maxReturnable)
                      }
                      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-35 cursor-pointer"
                      aria-label="Disminuir cantidad a devolver"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-extrabold">{currentQty}</span>
                    <button
                      type="button"
                      disabled={currentQty >= maxReturnable}
                      onClick={() =>
                        handleAdjustReturnQty(line.IDVariante, currentQty + 1, maxReturnable)
                      }
                      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Incrementar cantidad a devolver"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Input
            label="Motivo obligatorio de la devolución"
            placeholder="Describe por qué deseas devolver estas unidades (mínimo 5 caracteres)"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={returnModal.close}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              isLoading={isRequestingReturn}
              onClick={() => void handleConfirmReturn()}
            >
              Enviar solicitud de devolución
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
