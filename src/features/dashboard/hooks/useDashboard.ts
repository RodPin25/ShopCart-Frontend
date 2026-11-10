import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { usePagination } from '../../../hooks';
import { reportsService } from '../api/dashboard.api';
import type { SalesPeriodGrouping } from '../types';

export const DASHBOARD_KPIS_QUERY_KEY = ['admin', 'dashboard', 'kpis'] as const;
export const DASHBOARD_SALES_PERIOD_QUERY_KEY = [
  'admin',
  'dashboard',
  'sales-by-period',
] as const;
export const DASHBOARD_SALES_CATEGORY_QUERY_KEY = [
  'admin',
  'dashboard',
  'sales-by-category',
] as const;
export const DASHBOARD_TOP_PRODUCTS_QUERY_KEY = [
  'admin',
  'dashboard',
  'top-products',
] as const;
export const DASHBOARD_ABANDONED_CARTS_QUERY_KEY = [
  'admin',
  'dashboard',
  'abandoned-carts',
] as const;

/**
 * Custom Hook para el Dashboard Ejecutivo y Reportes Operativos (RF-08 — Operador / Administrador):
 * - Filtros reactivos por rango de fechas (`fechaInicio`, `fechaFin`), agrupación temporal (`DIA`, `SEMANA`, `MES`) y umbral de abandono.
 * - Consulta paralela de KPIs, Ventas por Período, Ventas por Categoría, Top 10 Productos y Carritos Abandonados paginados.
 */
export function useDashboard() {
  const abandonedPagination = usePagination({ initialPage: 1, initialPageSize: 8 });

  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [agrupacion, setAgrupacion] = useState<SalesPeriodGrouping>('DIA');
  const [minutosInactividad, setMinutosInactividad] = useState<number>(60);

  const dateParams = {
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  };

  const kpisQuery = useQuery({
    queryKey: [...DASHBOARD_KPIS_QUERY_KEY, dateParams, minutosInactividad],
    queryFn: () =>
      reportsService.getKPIs({
        ...dateParams,
        minutosAbandono: minutosInactividad,
      }),
  });

  const salesByPeriodQuery = useQuery({
    queryKey: [...DASHBOARD_SALES_PERIOD_QUERY_KEY, dateParams, agrupacion],
    queryFn: () =>
      reportsService.getSalesByPeriod({
        ...dateParams,
        agrupacion,
      }),
  });

  const salesByCategoryQuery = useQuery({
    queryKey: [...DASHBOARD_SALES_CATEGORY_QUERY_KEY, dateParams],
    queryFn: () => reportsService.getSalesByCategory(dateParams),
  });

  const topProductsQuery = useQuery({
    queryKey: [...DASHBOARD_TOP_PRODUCTS_QUERY_KEY, dateParams],
    queryFn: () =>
      reportsService.getTopProducts({
        ...dateParams,
        topN: 10,
      }),
  });

  const abandonedCartsQuery = useQuery({
    queryKey: [
      ...DASHBOARD_ABANDONED_CARTS_QUERY_KEY,
      abandonedPagination.numeroPagina,
      abandonedPagination.tamanoPagina,
      minutosInactividad,
    ],
    queryFn: () =>
      reportsService.getAbandonedCarts({
        numeroPagina: abandonedPagination.numeroPagina,
        tamanoPagina: abandonedPagination.tamanoPagina,
        minutosInactividad,
      }),
  });

  const refetchAll = () => {
    void kpisQuery.refetch();
    void salesByPeriodQuery.refetch();
    void salesByCategoryQuery.refetch();
    void topProductsQuery.refetch();
    void abandonedCartsQuery.refetch();
  };

  const resetFilters = () => {
    setFechaInicio('');
    setFechaFin('');
    setAgrupacion('DIA');
    setMinutosInactividad(60);
    abandonedPagination.resetPage();
  };

  return {
    // Filtros
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    agrupacion,
    setAgrupacion,
    minutosInactividad,
    setMinutosInactividad: (val: number) => {
      setMinutosInactividad(Math.max(1, val));
      abandonedPagination.resetPage();
    },
    resetFilters,
    refetchAll,

    // KPIs
    kpis: kpisQuery.data ?? null,
    isLoadingKpis: kpisQuery.isLoading,
    isErrorKpis: kpisQuery.isError,
    errorKpis: kpisQuery.error ? getApiErrorMessage(kpisQuery.error) : null,

    // Ventas por Período (DIA / SEMANA / MES)
    salesByPeriod: salesByPeriodQuery.data ?? [],
    isLoadingSalesByPeriod: salesByPeriodQuery.isLoading,

    // Ventas por Categoría
    salesByCategory: salesByCategoryQuery.data ?? [],
    isLoadingSalesByCategory: salesByCategoryQuery.isLoading,

    // Top 10 Productos Más Vendidos
    topProducts: topProductsQuery.data ?? [],
    isLoadingTopProducts: topProductsQuery.isLoading,

    // Carritos Abandonados
    abandonedCarts: abandonedCartsQuery.data?.items ?? [],
    abandonedTotalRegistros: abandonedCartsQuery.data?.totalRegistros ?? 0,
    abandonedTotalPaginas: abandonedCartsQuery.data?.totalPaginas ?? 1,
    abandonedMontoTotalGTQ: abandonedCartsQuery.data?.montoPotencialTotalGTQ ?? 0,
    abandonedPage: abandonedPagination.numeroPagina,
    abandonedPageSize: abandonedPagination.tamanoPagina,
    setAbandonedPage: abandonedPagination.setPage,
    isLoadingAbandonedCarts: abandonedCartsQuery.isLoading,
  };
}
