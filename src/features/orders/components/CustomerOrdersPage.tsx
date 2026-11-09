import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { formatGTQ, ORDER_STATUS, type OrderStatus } from '../../../config/constants';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Select,
  Spinner,
} from '../../../components';
import { useCustomerOrders } from '../hooks/useCustomerOrders';
import { OrderStatusBadge } from './OrderLifecycleBar';

export function CustomerOrdersPage() {
  const {
    orders,
    totalRegistros,
    totalPaginas,
    numeroPagina,
    tamanoPagina,
    setPage,
    statusFilter,
    setStatusFilter,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,
  } = useCustomerOrders();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1E2D4A] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-[#E31E24]" />
            <span>Mis Pedidos</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta el estado en tiempo real, el detalle con precios congelados y solicita devoluciones
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            aria-label="Filtrar pedidos por estado"
            value={statusFilter ?? ''}
            onChange={(e) =>
              setStatusFilter(e.target.value ? (e.target.value as OrderStatus) : undefined)
            }
            options={[
              { value: '', label: 'Todos los estados' },
              { value: ORDER_STATUS.PENDIENTE, label: 'Pendiente' },
              { value: ORDER_STATUS.PAGADO, label: 'Pagado' },
              { value: ORDER_STATUS.EN_PREPARACION, label: 'En preparación' },
              { value: ORDER_STATUS.ENVIADO, label: 'Despachado / Enviado' },
              { value: ORDER_STATUS.ENTREGADO, label: 'Entregado' },
              { value: ORDER_STATUS.CANCELADO, label: 'Cancelado' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <Card className="py-14 flex justify-center">
          <Spinner size="lg" label="Cargando tu historial de pedidos..." />
        </Card>
      ) : isError ? (
        <ErrorState
          message={error ?? 'No pudimos obtener tus pedidos.'}
          onRetry={() => void refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="No tienes pedidos registrados"
          description={
            statusFilter
              ? `No se encontraron pedidos con el estado "${statusFilter}".`
              : 'Cuando confirmes una compra en el Checkout, aparecerá aquí con su seguimiento.'
          }
          action={
            <Link to="/">
              <Button variant="primary">Ir a comprar</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.IDPedido}
              accent={order.EstadoPedido === ORDER_STATUS.ENTREGADO ? 'emerald' : 'blue'}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#E31E24]/50 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-extrabold text-[#0A2259] dark:text-white">
                    Pedido #{order.IDPedido}
                  </span>
                  <OrderStatusBadge status={order.EstadoPedido} />
                  {order.CodigoCupon && (
                    <Badge variant="red">Cupón: {order.CodigoCupon}</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fecha de compra: {new Date(order.FechaPedido).toLocaleString('es-GT')}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#1E2D4A]">
                <div className="text-left sm:text-right">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Total Congelado (IVA 12%)
                  </span>
                  <span className="text-lg font-extrabold text-[#0A2259] dark:text-white">
                    {formatGTQ(order.Total)}
                  </span>
                </div>

                <Link to={`/mis-pedidos/${order.IDPedido}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Ver seguimiento
                  </Button>
                </Link>
              </div>
            </Card>
          ))}

          <Pagination
            currentPage={numeroPagina}
            totalPages={totalPaginas}
            totalItems={totalRegistros}
            pageSize={tamanoPagina}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
