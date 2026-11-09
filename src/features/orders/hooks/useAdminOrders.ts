import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import type { OrderStatus, ReturnStatus } from '../../../config/constants';
import { usePagination } from '../../../hooks';
import { ordersService, returnsService } from '../api/orders.api';
import type { ChangeOrderStatusPayload, RequestReturnPayload, ResolveReturnPayload } from '../types';
import { CUSTOMER_ORDERS_QUERY_KEY, ORDER_DETAIL_QUERY_KEY } from './useCustomerOrders';

export const ADMIN_ORDERS_QUERY_KEY = ['admin', 'orders'] as const;
export const ADMIN_RETURNS_QUERY_KEY = ['admin', 'returns'] as const;
export const ADMIN_RETURN_DETAIL_QUERY_KEY = ['admin', 'return-detail'] as const;

/**
 * Custom Hook para el panel de Operador / Administrador (RF-07 y RF-08):
 * - Listado paginado de pedidos con filtros server-side por estado, ID de cliente y rango de fechas.
 * - Transición de estado controlada según `ALLOWED_ORDER_TRANSITIONS`.
 * - Listado y resolución de devoluciones (`APROBADA` / `RECHAZADA`) con reintegro automático al Kardex.
 */
export function useAdminOrders() {
  const queryClient = useQueryClient();
  const ordersPagination = usePagination({ initialPage: 1, initialPageSize: 10 });
  const returnsPagination = usePagination({ initialPage: 1, initialPageSize: 10 });

  const [estadoPedido, setEstadoPedido] = useState<OrderStatus | undefined>(undefined);
  const [idCliente, setIdCliente] = useState<number | undefined>(undefined);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const [estadoDevolucion, setEstadoDevolucion] = useState<ReturnStatus | undefined>(undefined);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);

  const orderFilters = {
    numeroPagina: ordersPagination.numeroPagina,
    tamanoPagina: ordersPagination.tamanoPagina,
    estadoPedido,
    idCliente,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  };

  const returnFilters = {
    numeroPagina: returnsPagination.numeroPagina,
    tamanoPagina: returnsPagination.tamanoPagina,
    estado: estadoDevolucion,
  };

  const ordersQuery = useQuery({
    queryKey: [...ADMIN_ORDERS_QUERY_KEY, orderFilters],
    queryFn: () => ordersService.listOrders(orderFilters),
  });

  const selectedOrderDetailQuery = useQuery({
    queryKey: [...ORDER_DETAIL_QUERY_KEY, selectedOrderId],
    queryFn: () => ordersService.getOrderById(selectedOrderId!),
    enabled: selectedOrderId !== null,
  });

  const returnsQuery = useQuery({
    queryKey: [...ADMIN_RETURNS_QUERY_KEY, returnFilters],
    queryFn: () => returnsService.listReturns(returnFilters),
  });

  const selectedReturnDetailQuery = useQuery({
    queryKey: [...ADMIN_RETURN_DETAIL_QUERY_KEY, selectedReturnId],
    queryFn: () => returnsService.getReturnById(selectedReturnId!),
    enabled: selectedReturnId !== null,
  });

  const invalidateOrdersAndReturns = () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ORDER_DETAIL_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ADMIN_RETURNS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ADMIN_RETURN_DETAIL_QUERY_KEY });
  };

  const changeStatusMutation = useMutation({
    mutationFn: ({
      idPedido,
      payload,
    }: {
      idPedido: number;
      payload: ChangeOrderStatusPayload;
    }) => ordersService.changeOrderStatus(idPedido, payload),
    onSuccess: invalidateOrdersAndReturns,
  });

  const createReturnMutation = useMutation({
    mutationFn: (payload: RequestReturnPayload) => returnsService.requestReturn(payload),
    onSuccess: invalidateOrdersAndReturns,
  });

  const resolveReturnMutation = useMutation({
    mutationFn: ({
      idDevolucion,
      payload,
    }: {
      idDevolucion: number;
      payload: ResolveReturnPayload;
    }) => returnsService.resolveReturn(idDevolucion, payload),
    onSuccess: invalidateOrdersAndReturns,
  });

  const orders = ordersQuery.data?.items ?? [];
  const returnsList = returnsQuery.data?.items ?? [];

  return {
    orders,
    ordersTotalRegistros: ordersQuery.data?.totalRegistros ?? 0,
    ordersTotalPaginas: ordersQuery.data?.totalPaginas ?? 1,
    ordersPage: ordersPagination.numeroPagina,
    ordersPageSize: ordersPagination.tamanoPagina,
    setOrdersPage: ordersPagination.setPage,
    estadoPedido,
    setEstadoPedido: (status: OrderStatus | undefined) => {
      setEstadoPedido(status);
      ordersPagination.resetPage();
    },
    idCliente,
    setIdCliente: (id: number | undefined) => {
      setIdCliente(id);
      ordersPagination.resetPage();
    },
    fechaInicio,
    setFechaInicio: (date: string) => {
      setFechaInicio(date);
      ordersPagination.resetPage();
    },
    fechaFin,
    setFechaFin: (date: string) => {
      setFechaFin(date);
      ordersPagination.resetPage();
    },
    resetOrderFilters: () => {
      setEstadoPedido(undefined);
      setIdCliente(undefined);
      setFechaInicio('');
      setFechaFin('');
      ordersPagination.resetPage();
    },
    isLoadingOrders: ordersQuery.isLoading,
    isErrorOrders: ordersQuery.isError,
    errorOrders: ordersQuery.error ? getApiErrorMessage(ordersQuery.error) : null,
    isEmptyOrders: !ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0,
    refetchOrders: ordersQuery.refetch,

    selectedOrderId,
    setSelectedOrderId,
    selectedOrderDetail: selectedOrderDetailQuery.data ?? null,
    isLoadingSelectedOrder: selectedOrderDetailQuery.isLoading,

    returnsList,
    returnsTotalRegistros: returnsQuery.data?.totalRegistros ?? 0,
    returnsTotalPaginas: returnsQuery.data?.totalPaginas ?? 1,
    returnsPage: returnsPagination.numeroPagina,
    returnsPageSize: returnsPagination.tamanoPagina,
    setReturnsPage: returnsPagination.setPage,
    estadoDevolucion,
    setEstadoDevolucion: (status: ReturnStatus | undefined) => {
      setEstadoDevolucion(status);
      returnsPagination.resetPage();
    },
    isLoadingReturns: returnsQuery.isLoading,
    isErrorReturns: returnsQuery.isError,
    errorReturns: returnsQuery.error ? getApiErrorMessage(returnsQuery.error) : null,
    isEmptyReturns:
      !returnsQuery.isLoading && !returnsQuery.isError && returnsList.length === 0,
    refetchReturns: returnsQuery.refetch,

    selectedReturnId,
    setSelectedReturnId,
    selectedReturnDetail: selectedReturnDetailQuery.data ?? null,
    isLoadingSelectedReturn: selectedReturnDetailQuery.isLoading,

    changeOrderStatus: changeStatusMutation.mutateAsync,
    isChangingStatus: changeStatusMutation.isPending,
    createReturn: createReturnMutation.mutateAsync,
    isCreatingReturn: createReturnMutation.isPending,
    resolveReturn: resolveReturnMutation.mutateAsync,
    isResolvingReturn: resolveReturnMutation.isPending,
  };
}
