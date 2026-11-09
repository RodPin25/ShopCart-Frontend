import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  AbandonedCartItem,
  DashboardKPIs,
  PaginatedData,
   PaginationParams,
  ReportDateRangeParams,
  SalesByCategoryItem,
  SalesByPeriodItem,
  SalesPeriodGrouping,
  TopProductItem,
} from '../types';

/**
 * Servicio modular de Dashboard Ejecutivo y Reportes Analíticos (RF-08 - Operador/Admin).
 */
export const reportsService = {
  /**
   * GET /api/reports/kpis
   * Obtiene tarjetas de KPIs ejecutivos: ventas brutas/netas GTQ, devoluciones, ticket promedio y carritos abandonados (SP_Dashboard_ObtenerResumenKPIs).
   */
  async getKPIs(
    params?: ReportDateRangeParams & { minutosAbandono?: number }
  ): Promise<DashboardKPIs> {
    const { data } = await apiClient.get<ApiResponse<DashboardKPIs>>(
      API_ENDPOINTS.REPORTS.KPIS,
      { params }
    );
    return data.data;
  },

  /**
   * GET /api/reports/sales-by-period
   * Obtiene ventas netas en GTQ y número de pedidos agrupados por DIA, SEMANA o MES (SP_Dashboard_VentasPorPeriodo).
   */
  async getSalesByPeriod(
    params?: ReportDateRangeParams & { agrupacion?: SalesPeriodGrouping }
  ): Promise<SalesByPeriodItem[]> {
    const { data } = await apiClient.get<ApiResponse<SalesByPeriodItem[]>>(
      API_ENDPOINTS.REPORTS.SALES_BY_PERIOD,
      { params }
    );
    return data.data;
  },

  /**
   * GET /api/reports/sales-by-category
   * Obtiene ventas netas por categoría y su porcentaje de participación (SP_Dashboard_VentasPorCategoria).
   */
  async getSalesByCategory(
    params?: ReportDateRangeParams
  ): Promise<SalesByCategoryItem[]> {
    const { data } = await apiClient.get<ApiResponse<SalesByCategoryItem[]>>(
      API_ENDPOINTS.REPORTS.SALES_BY_CATEGORY,
      { params }
    );
    return data.data;
  },

  /**
   * GET /api/reports/top-products
   * Obtiene el Top 10 de productos más vendidos en el periodo seleccionado (SP_Dashboard_TopProductosMasVendidos).
   */
  async getTopProducts(
    params?: ReportDateRangeParams & { topN?: number }
  ): Promise<TopProductItem[]> {
    const { data } = await apiClient.get<ApiResponse<TopProductItem[]>>(
      API_ENDPOINTS.REPORTS.TOP_PRODUCTS,
      { params: { topN: 10, ...params } }
    );
    return data.data;
  },

  /**
   * GET /api/reports/abandoned-carts
   * Obtiene el listado paginado de carritos abandonados sin actividad (SP_Dashboard_ListarCarritosAbandonados).
   */
  async getAbandonedCarts(
    params?: PaginationParams & { minutosInactividad?: number }
  ): Promise<PaginatedData<AbandonedCartItem>> {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<AbandonedCartItem>>
    >(API_ENDPOINTS.REPORTS.ABANDONED_CARTS, { params });
    return data.data;
  },
};

export default reportsService;
