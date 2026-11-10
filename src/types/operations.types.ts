import type { AuditAction, AuditModule } from '../config/constants';
import type { PaginationParams } from './common.types';

/**
 * RF-03: Inventario y Conciliación contra Kardex (`SP_Inventario_ListarExistencias`).
 */
export interface StockItem {
  IDVariante: number;
  SKU: string;
  NombreVariante: string;
  IDProducto: number;
  NombreProducto: string;
  IDCategoria: number;
  NombreCategoria: string;
  Precio: number;
  StockFisico: number;
  StockReservado: number;
  StockDisponible: number;
  SumaKardex: number;
  Conciliado: boolean;
  BajoStock?: boolean;
  Activo: boolean;
}

export interface StockFilters extends PaginationParams {
  idCategoria?: number;
  busqueda?: string;
  soloBajoStock?: boolean;
  umbralBajoStock?: number;
}

/**
 * RF-03: Movimientos del Kardex (`SP_Inventario_ConsultarKardex`).
 */
export type KardexMovementType =
  | 'VENTA'
  | 'AJUSTE_ENTRADA'
  | 'AJUSTE_SALIDA'
  | 'DEVOLUCION';

export interface KardexMovement {
  IDMovimientoKardex: number;
  IDVariante: number;
  SKU: string;
  NombreVariante: string;
  IDProducto: number;
  NombreProducto: string;
  TipoMovimiento: KardexMovementType;
  Cantidad: number;
  SaldoAnterior: number;
  SaldoNuevo: number;
  Motivo: string;
  IDPedidoReferencia?: number | null;
  IDUsuario: number;
  NombreUsuario?: string;
  FechaMovimiento: string;
}

export interface KardexFilters extends PaginationParams {
  idVariante?: number;
  idProducto?: number;
  tipoMovimiento?: KardexMovementType;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface InventoryAdjustmentPayload {
  idVariante: number;
  tipoMovimiento: 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA';
  cantidad: number;
  motivo: string;
}

/**
 * RF-08: Dashboard Ejecutivo y Reportes (`SP_Dashboard_*`).
 */
export interface DashboardKPIs {
  VentasBrutasGTQ: number;
  TotalDevolucionesGTQ: number;
  VentasNetasGTQ: number;
  VentaNetaSinIVAGTQ?: number;
  MontoIVANetoGTQ?: number;
  TotalPedidosCompletados: number;
  PedidosCancelados: number;
  UnidadesNetasVendidas?: number;
  TicketPromedioGTQ: number;
  CarritosAbandonadosCount: number;
  MontoPotencialAbandonadoGTQ: number;
}

export type SalesPeriodGrouping = 'DIA' | 'SEMANA' | 'MES';

export interface SalesByPeriodItem {
  Periodo: string;
  EtiquetaPeriodo?: string;
  TotalPedidos: number;
  UnidadesVendidas?: number;
  VentasBrutasGTQ?: number;
  DevolucionesGTQ?: number;
  VentasNetasGTQ: number;
  TicketPromedioGTQ?: number;
}

export interface SalesByCategoryItem {
  IDCategoria: number;
  NombreCategoria: string;
  TotalPedidos: number;
  UnidadesVendidas: number;
  VentasNetasGTQ: number;
  PorcentajeParticipacion: number;
}

export interface TopProductItem {
  Ranking?: number;
  IDProducto: number;
  NombreProducto: string;
  IDVariante?: number;
  SKU?: string;
  NombreVariante?: string;
  NombreCategoria: string;
  UnidadesBrutasVendidas?: number;
  UnidadesDevueltas?: number;
  UnidadesNetasVendidas: number;
  IngresosNetosGTQ: number;
  TotalPedidos: number;
}

export interface AbandonedCartItem {
  IDCarrito: number;
  IDUsuario: number | null;
  NombreCliente: string | null;
  CorreoCliente: string | null;
  TokenInvitado: string | null;
  TotalItems: number;
  TotalUnidades: number;
  MontoPotencialGTQ: number;
  UltimaActividad: string;
  MinutosInactivo: number;
  HorasInactividad?: number;
}

export interface ReportDateRangeParams {
  fechaInicio?: string;
  fechaFin?: string;
}

/**
 * RF-09: Bitácora Inmutable de Auditoría (`SP_Auditoria_ConsultarBitacora`).
 */
export interface AuditLogItem {
  IDBitacora: number;
  Modulo: AuditModule | string;
  Entidad: string;
  IDRegistroEntidad: string | number;
  Accion: AuditAction | string;
  ValorAnterior: string | null;
  ValorNuevo: string | null;
  IDUsuario: number | null;
  NombreUsuario?: string | null;
  CorreoUsuario?: string | null;
  RolUsuario?: string | null;
  DireccionIP?: string | null;
  FechaEvento: string;
}

export interface AuditFilters extends PaginationParams {
  modulo?: AuditModule | '';
  accion?: AuditAction | '';
  idUsuario?: number;
  fechaInicio?: string;
  fechaFin?: string;
}
