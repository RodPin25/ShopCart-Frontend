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

function cleanReportParams(params?: Record<string, unknown>): Record<string, unknown> {
  if (!params) return {};
  const cleaned: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

function normalizeKPIs(raw: Record<string, unknown>): DashboardKPIs {
  return {
    VentasBrutasGTQ: Number(raw.VentasBrutasGTQ ?? raw.VentaBrutaGTQ ?? 0),
    TotalDevolucionesGTQ: Number(
      raw.TotalDevolucionesGTQ ?? raw.MontoDevolucionesGTQ ?? 0,
    ),
    VentasNetasGTQ: Number(raw.VentasNetasGTQ ?? raw.VentaNetaGTQ ?? 0),
    VentaNetaSinIVAGTQ: Number(raw.VentaNetaSinIVAGTQ ?? 0),
    MontoIVANetoGTQ: Number(raw.MontoIVANetoGTQ ?? 0),
    TotalPedidosCompletados: Number(
      raw.TotalPedidosCompletados ?? raw.NumeroPedidosCompletados ?? 0,
    ),
    PedidosCancelados: Number(raw.PedidosCancelados ?? 0),
    UnidadesNetasVendidas: Number(raw.UnidadesNetasVendidas ?? 0),
    TicketPromedioGTQ: Number(raw.TicketPromedioGTQ ?? 0),
    CarritosAbandonadosCount: Number(
      raw.CarritosAbandonadosCount ?? raw.TotalCarritosAbandonados ?? 0,
    ),
    MontoPotencialAbandonadoGTQ: Number(
      raw.MontoPotencialAbandonadoGTQ ?? raw.MontoCarritosAbandonadosGTQ ?? 0,
    ),
  };
}

function normalizeSalesByPeriod(raw: Record<string, unknown>): SalesByPeriodItem {
  const label = String(
    raw.EtiquetaPeriodo ?? raw.Periodo ?? raw.FechaReferencia ?? '',
  );
  return {
    Periodo: label,
    EtiquetaPeriodo: label,
    TotalPedidos: Number(raw.TotalPedidos ?? raw.NumeroPedidos ?? 0),
    UnidadesVendidas: Number(
      raw.UnidadesVendidas ?? raw.UnidadesNetasVendidas ?? 0,
    ),
    DevolucionesGTQ: Number(
      raw.DevolucionesGTQ ?? raw.MontoDevolucionesGTQ ?? 0,
    ),
    VentasNetasGTQ: Number(raw.VentasNetasGTQ ?? raw.VentaNetaGTQ ?? 0),
    TicketPromedioGTQ: Number(raw.TicketPromedioGTQ ?? 0),
  };
}

function normalizeSalesByCategory(raw: Record<string, unknown>): SalesByCategoryItem {
  return {
    IDCategoria: Number(raw.IDCategoria ?? 0),
    NombreCategoria: String(raw.NombreCategoria ?? 'Sin categoría'),
    TotalPedidos: Number(raw.TotalPedidos ?? raw.NumeroPedidos ?? 0),
    UnidadesVendidas: Number(
      raw.UnidadesVendidas ?? raw.UnidadesNetasVendidas ?? 0,
    ),
    VentasNetasGTQ: Number(raw.VentasNetasGTQ ?? raw.VentaNetaGTQ ?? 0),
    PorcentajeParticipacion: Number(raw.PorcentajeParticipacion ?? 0),
  };
}

function normalizeTopProduct(
  raw: Record<string, unknown>,
  index: number,
): TopProductItem {
  return {
    Ranking: Number(raw.Ranking ?? index + 1),
    IDProducto: Number(raw.IDProducto ?? 0),
    NombreProducto: String(raw.NombreProducto ?? ''),
    NombreCategoria: String(raw.NombreCategoria ?? ''),
    UnidadesBrutasVendidas: Number(raw.UnidadesBrutasVendidas ?? 0),
    UnidadesDevueltas: Number(raw.UnidadesDevueltas ?? 0),
    UnidadesNetasVendidas: Number(raw.UnidadesNetasVendidas ?? 0),
    IngresosNetosGTQ: Number(raw.IngresosNetosGTQ ?? raw.IngresoNetoGTQ ?? 0),
    TotalPedidos: Number(raw.TotalPedidos ?? raw.NumeroPedidos ?? 0),
  };
}

function normalizeAbandonedCart(raw: Record<string, unknown>): AbandonedCartItem {
  return {
    IDCarrito: Number(raw.IDCarrito ?? 0),
    IDUsuario:
      raw.IDUsuario !== undefined && raw.IDUsuario !== null
        ? Number(raw.IDUsuario)
        : null,
    NombreCliente: (raw.NombreCliente as string | null | undefined) ?? null,
    CorreoCliente: (raw.CorreoCliente as string | null | undefined) ?? null,
    TokenInvitado: (raw.TokenInvitado as string | null | undefined) ?? null,
    TotalItems: Number(raw.TotalItems ?? raw.TotalLineas ?? 0),
    TotalUnidades: Number(raw.TotalUnidades ?? 0),
    MontoPotencialGTQ: Number(
      raw.MontoPotencialGTQ ?? raw.MontoEstimadoGTQ ?? 0,
    ),
    UltimaActividad: String(
      raw.UltimaActividad ?? raw.FechaCreacion ?? new Date().toISOString(),
    ),
    MinutosInactivo: Number(
      raw.MinutosInactivo ?? raw.MinutosInactividad ?? 0,
    ),
    HorasInactividad: Number(raw.HorasInactividad ?? 0),
  };
}

/**
 * Servicio modular de Dashboard Ejecutivo y Reportes Analíticos (RF-08 - Operador/Admin).
 */
export const reportsService = {
  /**
   * GET /api/reports/kpis
   * Obtiene tarjetas de KPIs ejecutivos: ventas brutas/netas GTQ, devoluciones, ticket promedio y carritos abandonados (SP_Dashboard_ObtenerResumenKPIs).
   */
  async getKPIs(
    params?: ReportDateRangeParams & { minutosAbandono?: number },
  ): Promise<DashboardKPIs> {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      API_ENDPOINTS.REPORTS.KPIS,
      { params: cleanReportParams(params as Record<string, unknown>) },
    );
    return normalizeKPIs(data.data ?? {});
  },

  /**
   * GET /api/reports/sales-by-period
   * Obtiene ventas netas en GTQ y número de pedidos agrupados por DIA, SEMANA o MES (SP_Dashboard_VentasPorPeriodo).
   */
  async getSalesByPeriod(
    params?: ReportDateRangeParams & { agrupacion?: SalesPeriodGrouping },
  ): Promise<SalesByPeriodItem[]> {
    const { data } = await apiClient.get<
      ApiResponse<Array<Record<string, unknown>>>
    >(API_ENDPOINTS.REPORTS.SALES_BY_PERIOD, {
      params: cleanReportParams(params as Record<string, unknown>),
    });
    const rawList = Array.isArray(data.data) ? data.data : [];
    return rawList.map((item) => normalizeSalesByPeriod(item));
  },

  /**
   * GET /api/reports/sales-by-category
   * Obtiene ventas netas por categoría y su porcentaje de participación (SP_Dashboard_VentasPorCategoria).
   */
  async getSalesByCategory(
    params?: ReportDateRangeParams,
  ): Promise<SalesByCategoryItem[]> {
    const { data } = await apiClient.get<
      ApiResponse<Array<Record<string, unknown>>>
    >(API_ENDPOINTS.REPORTS.SALES_BY_CATEGORY, {
      params: cleanReportParams(params as Record<string, unknown>),
    });
    const rawList = Array.isArray(data.data) ? data.data : [];
    return rawList.map((item) => normalizeSalesByCategory(item));
  },

  /**
   * GET /api/reports/top-products
   * Obtiene el Top 10 de productos más vendidos en el periodo seleccionado (SP_Dashboard_TopProductosMasVendidos).
   */
  async getTopProducts(
    params?: ReportDateRangeParams & { topN?: number },
  ): Promise<TopProductItem[]> {
    const { data } = await apiClient.get<
      ApiResponse<Array<Record<string, unknown>>>
    >(API_ENDPOINTS.REPORTS.TOP_PRODUCTS, {
      params: cleanReportParams({ topN: 10, ...params } as Record<string, unknown>),
    });
    const rawList = Array.isArray(data.data) ? data.data : [];
    return rawList.map((item, idx) => normalizeTopProduct(item, idx));
  },

  /**
   * GET /api/reports/abandoned-carts
   * Obtiene el listado paginado de carritos abandonados sin actividad (SP_Dashboard_ListarCarritosAbandonados).
   */
  async getAbandonedCarts(
    params?: PaginationParams & { minutosInactividad?: number },
  ): Promise<
    PaginatedData<AbandonedCartItem> & { montoPotencialTotalGTQ?: number }
  > {
    const { data } = await apiClient.get<
      ApiResponse<
        PaginatedData<Record<string, unknown>> & {
          montoPotencialTotalGTQ?: number;
        }
      >
    >(API_ENDPOINTS.REPORTS.ABANDONED_CARTS, {
      params: cleanReportParams(params as Record<string, unknown>),
    });

    const rawPaginated = data.data;
    const rawItems = Array.isArray(rawPaginated?.items)
      ? rawPaginated.items
      : [];
    return {
      ...rawPaginated,
      items: rawItems.map((item) => normalizeAbandonedCart(item)),
      montoPotencialTotalGTQ: Number(
        rawPaginated?.montoPotencialTotalGTQ ?? 0,
      ),
    };
  },
};

export default reportsService;
