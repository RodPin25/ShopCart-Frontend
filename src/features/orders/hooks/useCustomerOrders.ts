import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { ORDER_STATUS, type OrderStatus } from '../../../config/constants';
import { usePagination } from '../../../hooks';
import { ordersService, returnsService } from '../api/orders.api';
import type { OrderLineItem, RequestReturnPayload } from '../types';

export const CUSTOMER_ORDERS_QUERY_KEY = ['orders', 'customer'] as const;
export const ORDER_DETAIL_QUERY_KEY = ['orders', 'detail'] as const;

/**
 * Calcula la cantidad máxima que aún se puede devolver en una línea de pedido (RF-07):
 * `CantidadVendida - CantidadDevuelta`.
 */
export function getMaxReturnableQuantity(line: OrderLineItem): number {
  if (typeof line.CantidadDisponibleDevolver === 'number') {
    return Math.max(0, line.CantidadDisponibleDevolver);
  }
  const alreadyReturned = line.CantidadDevuelta ?? 0;
  return Math.max(0, line.Cantidad - alreadyReturned);
}

/**
 * Custom Hook para que el Cliente consulte el historial de sus propios pedidos (RF-07).
 */
export function useCustomerOrders() {
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);

  const filters = {
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    estadoPedido: statusFilter,
  };

  const ordersQuery = useQuery({
    queryKey: [...CUSTOMER_ORDERS_QUERY_KEY, filters],
    queryFn: () => ordersService.listOrders(filters),
  });

  const orders = ordersQuery.data?.items ?? [];

  return {
    orders,
    totalRegistros: ordersQuery.data?.totalRegistros ?? 0,
    totalPaginas: ordersQuery.data?.totalPaginas ?? 1,
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    setPage: pagination.setPage,
    statusFilter,
    setStatusFilter: (status: OrderStatus | undefined) => {
      setStatusFilter(status);
      pagination.resetPage();
    },
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error ? getApiErrorMessage(ordersQuery.error) : null,
    isEmpty: !ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0,
    refetch: ordersQuery.refetch,
  };
}

/**
 * Custom Hook para consultar el detalle de un pedido, cancelarlo (mientras no haya sido enviado)
 * o solicitar una devolución total/parcial por línea (RF-07).
 */
export function useOrderDetail(idPedido: number) {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: [...ORDER_DETAIL_QUERY_KEY, idPedido],
    queryFn: () => ordersService.getOrderById(idPedido),
    enabled: Number.isFinite(idPedido) && idPedido > 0,
  });

  const cancelMutation = useMutation({
    mutationFn: (motivo: string) =>
      ordersService.changeOrderStatus(idPedido, {
        estadoNuevo: ORDER_STATUS.CANCELADO,
        motivo: motivo.trim() || 'Cancelado por el cliente antes del despacho',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...ORDER_DETAIL_QUERY_KEY, idPedido] });
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
    },
  });

  const requestReturnMutation = useMutation({
    mutationFn: (payload: RequestReturnPayload) => returnsService.requestReturn(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...ORDER_DETAIL_QUERY_KEY, idPedido] });
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
    },
  });

  const orderHeader = detailQuery.data?.pedido ?? null;
  const lines = detailQuery.data?.detalles ?? [];
  const payments = detailQuery.data?.pagos ?? [];
  const statusHistory = detailQuery.data?.historialEstados ?? [];

  // Regla RF-07: "Un pedido puede cancelarse mientras no haya sido despachado"
  const canCancelOrder = Boolean(
    orderHeader &&
      (orderHeader.EstadoPedido === ORDER_STATUS.PENDIENTE ||
        orderHeader.EstadoPedido === ORDER_STATUS.PAGADO ||
        orderHeader.EstadoPedido === ORDER_STATUS.EN_PREPARACION),
  );

  // Regla RF-07: Devoluciones sobre pedidos ENTREGADOS con unidades disponibles para devolver
  const canRequestReturn = Boolean(
    orderHeader &&
      orderHeader.EstadoPedido === ORDER_STATUS.ENTREGADO &&
      lines.some((line) => getMaxReturnableQuantity(line) > 0),
  );

  return {
    order: orderHeader,
    lines,
    payments,
    statusHistory,
    canCancelOrder,
    canRequestReturn,
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    error: detailQuery.error ? getApiErrorMessage(detailQuery.error) : null,
    isEmpty: !detailQuery.isLoading && !detailQuery.isError && !orderHeader,
    refetch: detailQuery.refetch,
    cancelOrder: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    requestReturn: requestReturnMutation.mutateAsync,
    isRequestingReturn: requestReturnMutation.isPending,
  };
}
