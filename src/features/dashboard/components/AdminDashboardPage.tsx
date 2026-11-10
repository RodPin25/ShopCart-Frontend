import {
  Award,
  BarChart3,
  Clock,
  DollarSign,
  PieChart as PieChartIcon,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { clsx } from 'clsx';
import { formatGTQ } from '../../../config/constants';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select,
  Spinner,
} from '../../../components';
import { useDashboard } from '../hooks/useDashboard';
import type { SalesPeriodGrouping } from '../types';

const CATEGORY_CHART_COLORS = [
  '#E31E24',
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
];

/**
 * Dashboard Ejecutivo y Reportes Operativos (`/admin/dashboard` — RF-08).
 * Accesible para `Operador` y `Administrador`.
 */
export function AdminDashboardPage() {
  const {
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    agrupacion,
    setAgrupacion,
    minutosInactividad,
    setMinutosInactividad,
    resetFilters,
    refetchAll,

    kpis,
    isLoadingKpis,
    isErrorKpis,
    errorKpis,

    salesByPeriod,
    isLoadingSalesByPeriod,

    salesByCategory,
    isLoadingSalesByCategory,

    topProducts,
    isLoadingTopProducts,

    abandonedCarts,
    abandonedTotalRegistros,
    abandonedTotalPaginas,
    abandonedMontoTotalGTQ,
    abandonedPage,
    abandonedPageSize,
    setAbandonedPage,
    isLoadingAbandonedCarts,
  } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Encabezado Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
            Dashboard Ejecutivo y Reportes Operativos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Métricas financieras en Quetzales (GTQ) con 12% IVA incluido, descontando devoluciones
            aprobadas (RF-08)
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={refetchAll}
          leftIcon={<RefreshCw className="w-4 h-4 text-[#E31E24]" />}
        >
          Actualizar métricas
        </Button>
      </div>

      {/* Barra Global de Filtros Server-Side (Rango de Fechas, Agrupación y Umbral de Abandono) */}
      <Card accent="blue" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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

          <Select
            label="Agrupación de ventas"
            value={agrupacion}
            onChange={(e) => setAgrupacion(e.target.value as SalesPeriodGrouping)}
            options={[
              { value: 'DIA', label: 'Por Día (DIA)' },
              { value: 'SEMANA', label: 'Por Semana (SEMANA)' },
              { value: 'MES', label: 'Por Mes (MES)' },
            ]}
          />

          <Input
            label="Inactividad carrito (min)"
            type="number"
            min={5}
            step={5}
            value={minutosInactividad}
            onChange={(e) => setMinutosInactividad(Number(e.target.value) || 60)}
          />

          <Button variant="secondary" onClick={resetFilters}>
            Restablecer período
          </Button>
        </div>
      </Card>

      {/* Sección 1: Tarjetas de KPIs Ejecutivos (SP_Dashboard_ObtenerResumenKPIs) */}
      {isLoadingKpis ? (
        <Card className="py-10 flex justify-center">
          <Spinner label="Calculando KPIs financieros y operativos..." />
        </Card>
      ) : isErrorKpis ? (
        <ErrorState
          message={errorKpis ?? 'No fue posible cargar los KPIs ejecutivos.'}
          onRetry={refetchAll}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ventas Netas GTQ */}
          <Card accent="red" className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Ventas Netas (GTQ)
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#E31E24]/15 text-[#E31E24] flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
              {formatGTQ(kpis?.VentasNetasGTQ ?? 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1E2D4A]">
              <span>Bruta: {formatGTQ(kpis?.VentasBrutasGTQ ?? 0)}</span>
              <span className="text-[#E31E24] font-semibold">
                Dev: -{formatGTQ(kpis?.TotalDevolucionesGTQ ?? 0)}
              </span>
            </div>
          </Card>

          {/* KPI 2: Pedidos Completados y Unidades Netas */}
          <Card accent="blue" className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Pedidos Completados
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
              {kpis?.TotalPedidosCompletados ?? 0}{' '}
              <span className="text-sm font-bold text-slate-400">pedidos</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1E2D4A]">
              <span>{kpis?.UnidadesNetasVendidas ?? 0} uds. netas</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {kpis?.PedidosCancelados ?? 0} cancelados
              </span>
            </div>
          </Card>

          {/* KPI 3: Ticket Promedio e IVA */}
          <Card accent="emerald" className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Ticket Promedio
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatGTQ(kpis?.TicketPromedioGTQ ?? 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1E2D4A]">
              <span>Sin IVA: {formatGTQ(kpis?.VentaNetaSinIVAGTQ ?? 0)}</span>
              <span>IVA 12%: {formatGTQ(kpis?.MontoIVANetoGTQ ?? 0)}</span>
            </div>
          </Card>

          {/* KPI 4: Carritos Abandonados */}
          <Card accent="navy" className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Carritos Abandonados
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
              {kpis?.CarritosAbandonadosCount ?? 0}{' '}
              <span className="text-sm font-bold text-slate-400">carritos</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1E2D4A]">
              <span>Potencial en riesgo:</span>
              <strong className="text-amber-600 dark:text-amber-400">
                {formatGTQ(kpis?.MontoPotencialAbandonadoGTQ ?? 0)}
              </strong>
            </div>
          </Card>
        </div>
      )}

      {/* Sección 2: Gráficas Interactivas con Recharts (Ventas por Período y Ventas por Categoría) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfica 1: Evolución de Ventas Netas por Día / Semana / Mes */}
        <Card accent="red" className="lg:col-span-7 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E31E24]" />
                <span>Evolución de Ventas Netas y Devoluciones ({agrupacion})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ingresos netos en Quetzales descontando devoluciones aprobadas
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#1E2D4A] p-0.5 bg-slate-100 dark:bg-[#0B111E]">
              {(['DIA', 'SEMANA', 'MES'] as const).map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setAgrupacion(grp)}
                  className={clsx(
                    'px-2.5 py-1 rounded-md text-xs font-extrabold transition-colors cursor-pointer',
                    agrupacion === grp
                      ? 'bg-[#E31E24] text-white'
                      : 'text-slate-500 hover:text-[#0A2259] dark:hover:text-white',
                  )}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {isLoadingSalesByPeriod ? (
            <div className="h-72 flex items-center justify-center">
              <Spinner label="Graficando serie temporal..." />
            </div>
          ) : (salesByPeriod ?? []).length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <EmptyState
                title="Sin datos de ventas en este período"
                description="Ajusta las fechas para visualizar el comportamiento de ventas."
              />
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesByPeriod}
                  margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorVentasNetas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E31E24" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E31E24" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="Periodo"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(val: number) => `Q${val}`}
                  />
                  <Tooltip
                    formatter={(value) => formatGTQ(Number(value ?? 0))}
                    contentStyle={{
                      backgroundColor: '#0B111E',
                      borderColor: '#1E2D4A',
                      borderRadius: '0.75rem',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="VentasNetasGTQ"
                    name="Venta Neta (GTQ)"
                    stroke="#E31E24"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVentasNetas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="DevolucionesGTQ"
                    name="Devoluciones (GTQ)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={0.1}
                    fill="#F59E0B"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Gráfica 2: Ventas y Participación por Categoría */}
        <Card accent="blue" className="lg:col-span-5 p-5 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#E31E24]" />
              <span>Ventas por Categoría</span>
            </h2>
            <p className="text-xs text-slate-400">
              Participación porcentual y monto neto vendido por línea
            </p>
          </div>

          {isLoadingSalesByCategory ? (
            <div className="h-72 flex items-center justify-center">
              <Spinner label="Calculando distribución por categoría..." />
            </div>
          ) : (salesByCategory ?? []).length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <EmptyState
                title="Sin ventas por categoría"
                description="No hay ventas registradas en el rango seleccionado."
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesByCategory}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      tickFormatter={(val: number) => `Q${val}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="NombreCategoria"
                      width={100}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <Tooltip
                      formatter={(value) => formatGTQ(Number(value ?? 0))}
                      contentStyle={{
                        backgroundColor: '#0B111E',
                        borderColor: '#1E2D4A',
                        borderRadius: '0.75rem',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="VentasNetasGTQ" name="Venta Neta (GTQ)" radius={[0, 6, 6, 0]}>
                      {(salesByCategory ?? []).map((entry, idx) => (
                        <Cell
                          key={entry.IDCategoria}
                          fill={CATEGORY_CHART_COLORS[idx % CATEGORY_CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {(salesByCategory ?? []).map((cat, idx) => (
                  <div
                    key={cat.IDCategoria}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-[#1E2D4A] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_CHART_COLORS[idx % CATEGORY_CHART_COLORS.length],
                        }}
                      />
                      <span className="font-bold text-[#0A2259] dark:text-white">
                        {cat.NombreCategoria}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold">
                        {formatGTQ(cat.VentasNetasGTQ)}
                      </span>
                      <Badge variant="navy">
                        {Number(cat.PorcentajeParticipacion).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Sección 3: Top 10 Productos Más Vendidos y Tabla de Carritos Abandonados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top 10 Productos Más Vendidos (SP_Dashboard_TopProductosMasVendidos) */}
        <Card accent="navy" noPadding className="lg:col-span-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#E31E24]" />
                <span>Top 10 Productos Más Vendidos</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ordenados por unidades netas e ingreso neto en GTQ
              </p>
            </div>
            <Badge variant="red">Top 10</Badge>
          </div>

          {isLoadingTopProducts ? (
            <div className="py-12 flex justify-center">
              <Spinner label="Cargando ranking de productos..." />
            </div>
          ) : (topProducts ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin productos vendidos en este período"
                description="Los productos con pedidos pagados o entregados aparecerán aquí."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase text-[#0A2259] dark:text-slate-300">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Producto / Categoría</th>
                    <th className="py-3 px-4 text-center">Uds. Netas</th>
                    <th className="py-3 px-4 text-right">Ingreso Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A]">
                  {(topProducts ?? []).map((prod, index) => (
                    <tr
                      key={prod.IDProducto}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-extrabold text-[#E31E24]">
                        #{prod.Ranking ?? index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0A2259] dark:text-white">
                          {prod.NombreProducto}
                        </div>
                        <div className="text-xs text-slate-400">
                          {prod.NombreCategoria} · {prod.TotalPedidos} pedido(s)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-extrabold text-[#0A2259] dark:text-white">
                          {prod.UnidadesNetasVendidas}
                        </span>
                        {(prod.UnidadesDevueltas ?? 0) > 0 && (
                          <span className="block text-[10px] text-amber-500">
                            <RotateCcw className="w-2.5 h-2.5 inline mr-0.5" />
                            {prod.UnidadesDevueltas} dev.
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatGTQ(prod.IngresosNetosGTQ)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Carritos Abandonados (SP_Dashboard_ListarCarritosAbandonados) */}
        <Card accent="red" noPadding className="lg:col-span-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1E2D4A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E31E24]" />
                <span>Carritos Abandonados ({abandonedTotalRegistros})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Inactivos por ≥ {minutosInactividad} min · Potencial:{' '}
                <strong className="text-[#E31E24]">
                  {formatGTQ(abandonedMontoTotalGTQ)}
                </strong>
              </p>
            </div>
            <Badge variant="warning">Seguimiento Comercial</Badge>
          </div>

          {isLoadingAbandonedCarts ? (
            <div className="py-12 flex justify-center">
              <Spinner label="Consultando carritos abandonados..." />
            </div>
          ) : (abandonedCarts ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin carritos abandonados con este umbral"
                description={`No hay carritos activos con más de ${minutosInactividad} minutos de inactividad.`}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase text-[#0A2259] dark:text-slate-300">
                      <th className="py-3 px-4">Carrito / Cliente</th>
                      <th className="py-3 px-4 text-center">Artículos</th>
                      <th className="py-3 px-4 text-center">Inactividad</th>
                      <th className="py-3 px-4 text-right">Monto Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A]">
                    {(abandonedCarts ?? []).map((cart) => (
                      <tr
                        key={cart.IDCarrito}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0A2259] dark:text-white">
                            {cart.NombreCliente ?? 'Sesión Invitado'}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            #{cart.IDCarrito} ·{' '}
                            {cart.CorreoCliente ??
                              (cart.TokenInvitado
                                ? `${cart.TokenInvitado.slice(0, 12)}...`
                                : 'Sin token')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold">{cart.TotalUnidades} uds.</span>
                          <span className="block text-[11px] text-slate-400">
                            ({cart.TotalItems} líneas)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="warning">{cart.MinutosInactivo} min</Badge>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {new Date(cart.UltimaActividad).toLocaleDateString('es-GT')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#E31E24]">
                          {formatGTQ(cart.MontoPotencialGTQ)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4">
                <Pagination
                  currentPage={abandonedPage}
                  totalPages={abandonedTotalPaginas}
                  totalItems={abandonedTotalRegistros}
                  pageSize={abandonedPageSize}
                  onPageChange={setAbandonedPage}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
