import type { PaginationParams } from './common.types';

/**
 * Línea de detalle dentro del carrito activo (SP_Carrito_ObtenerDetalle - RF-04).
 */
export interface CartItem {
  IDCarritoDetalle: number;
  IDCarrito: number;
  IDVariante: number;
  SKU: string;
  NombreVariante: string;
  IDProducto: number;
  NombreProducto: string;
  IDCategoria: number;
  NombreCategoria: string;
  PrecioUnitario: number;
  Cantidad: number;
  SubtotalLinea: number;
  StockFisico: number;
  StockReservado: number;
  StockDisponible: number;
  StockSuficiente: boolean;
  FechaAgregado: string;
}

/**
 * Resumen financiero y de estado del carrito activo (RF-04, RF-05).
 */
export interface CartSummary {
  IDCarrito: number;
  IDUsuario: number | null;
  TokenInvitado: string | null;
  Estado: string;
  FechaCreacion: string;
  FechaActualizacion: string;
  TotalItems: number;
  TotalUnidades: number;
  Subtotal: number;
  IDCupon: number | null;
  CodigoCupon: string | null;
  CuponValido: boolean;
  MensajeCupon: string | null;
  MontoDescuento: number;
  TotalSinIVA: number;
  MontoIVA: number;
  Total: number;
}

/**
 * Respuesta completa de `GET /api/cart` y mutaciones del carrito.
 */
export interface CartData {
  carrito: CartSummary;
  items: CartItem[];
}

export type CartOperationMode = 'SUMAR' | 'FIJAR';

export interface UpsertCartItemPayload {
  idVariante: number;
  cantidad: number;
  modoOperacion?: CartOperationMode;
  tokenInvitado?: string;
}

/**
 * Cupón de descuento y reglas de vigencia (RF-05).
 */
export type DiscountType = 'PORCENTAJE' | 'MONTO_FIJO';

export interface Coupon {
  IDCupon: number;
  Codigo: string;
  TipoDescuento: DiscountType;
  ValorDescuento: number;
  MontoMinimoCompra: number;
  IDCategoria: number | null;
  NombreCategoria?: string | null;
  FechaInicio: string;
  FechaFin: string;
  LimiteUsosTotal: number;
  UsosActuales: number;
  UsosRestantes?: number;
  LimiteUsosPorCliente: number | null;
  Activo: boolean;
  Vigente?: boolean;
  FechaCreacion?: string;
}

export interface CouponUsageItem {
  IDCuponUso: number;
  IDCupon: number;
  IDUsuario: number;
  NombreCliente: string;
  CorreoCliente: string;
  IDPedido: number;
  SubtotalPedido: number;
  MontoDescuento: number;
  TotalPedido: number;
  FechaUso: string;
}

export interface CouponDetailData {
  cupon: Coupon;
  historialUsos: CouponUsageItem[];
}

export interface ValidateCouponPayload {
  codigo: string;
  tokenInvitado?: string;
}

export interface CouponValidationData {
  valido: boolean;
  mensaje: string;
  idCupon?: number;
  codigo?: string;
  tipoDescuento?: DiscountType;
  valorDescuento?: number;
  subtotalCarrito?: number;
  montoDescuento: number;
  nuevoTotal: number;
}

export interface CouponFilters extends PaginationParams {
  activo?: boolean;
  soloVigentes?: boolean;
  tipoDescuento?: DiscountType;
  busqueda?: string;
}

export interface CouponPayload {
  codigo: string;
  tipoDescuento: DiscountType;
  valorDescuento: number;
  montoMinimoCompra?: number;
  idCategoria?: number | null;
  fechaInicio: string;
  fechaFin: string;
  limiteUsosTotal: number;
  limiteUsosPorCliente?: number;
  activo?: boolean;
}

/**
 * Reserva temporal de inventario durante el checkout (TTL 15 minutos - RF-06).
 */
export interface CartReservationData {
  idCarrito: number;
  reservasCreadas?: number;
  fechaExpiracion?: string;
  ttlMinutos?: number;
}
