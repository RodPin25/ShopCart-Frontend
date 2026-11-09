import type { OrderStatus, ReturnStatus } from '../config/constants';
import type { PaginationParams } from './common.types';

/**
 * Payload y respuesta del Checkout atómico e idempotente (RF-06).
 */
export interface CheckoutPayload {
  idDireccion: number;
  idempotencyKey: string;
  codigoCupon?: string;
  metodoPago?: string;
  transaccionId?: string;
}

export interface CheckoutResultData {
  IDPedido: number;
  NumeroPedido?: string;
  EstadoPedido: OrderStatus;
  Subtotal: number;
  MontoDescuento: number;
  MontoIVA: number;
  Total: number;
  FechaPedido: string;
  FueRespuestaIdempotente?: boolean;
}

/**
 * Elemento en el listado paginado de pedidos (`SP_Pedidos_Listar` - RF-07, RF-08).
 */
export interface OrderListItem {
  IDPedido: number;
  IDUsuario: number;
  NombreCliente?: string;
  CorreoCliente?: string;
  EstadoPedido: OrderStatus;
  Subtotal: number;
  MontoDescuento: number;
  TotalSinIVA?: number;
  MontoIVA: number;
  Total: number;
  TotalUnidades?: number;
  CodigoCupon?: string | null;
  FechaPedido: string;
  FechaActualizacion?: string;
}

/**
 * Línea de detalle de un pedido con precio congelado al momento de la compra (RF-02, RF-06).
 */
export interface OrderLineItem {
  IDPedidoDetalle: number;
  IDPedido: number;
  IDVariante: number;
  SKU: string;
  NombreVariante: string;
  IDProducto: number;
  NombreProducto: string;
  Cantidad: number;
  PrecioUnitarioCongelado: number;
  DescuentoLinea?: number;
  SubtotalLinea: number;
  CantidadDevuelta?: number;
  CantidadDisponibleDevolver?: number;
}

/**
 * Registro de pago asociado al pedido.
 */
export interface OrderPayment {
  IDPago: number;
  IDPedido: number;
  MetodoPago: string;
  TransaccionID: string | null;
  MontoPagado: number;
  EstadoPago: string;
  FechaPago: string;
}

/**
 * Historial de transiciones de estado del pedido (`HistorialEstadosPedido` - RF-07).
 */
export interface OrderStatusHistoryItem {
  IDHistorialEstado: number;
  IDPedido: number;
  EstadoAnterior: OrderStatus | null;
  EstadoNuevo: OrderStatus;
  IDUsuario: number;
  NombreUsuario?: string;
  Motivo: string | null;
  FechaCambio: string;
}

/**
 * Encabezado completo del pedido en `GET /api/orders/{idPedido}`.
 */
export interface OrderHeader extends OrderListItem {
  IDDireccionEntrega: number;
  DireccionLinea?: string;
  Municipio?: string;
  Departamento?: string;
  CodigoPostal?: string | null;
  ReferenciaDireccion?: string | null;
}

/**
 * Respuesta con las 4 secciones de `GET /api/orders/{idPedido}` (RF-07).
 */
export interface OrderDetailData {
  pedido: OrderHeader;
  detalles: OrderLineItem[];
  pagos: OrderPayment[];
  historialEstados: OrderStatusHistoryItem[];
}

export interface OrderFilters extends PaginationParams {
  estadoPedido?: OrderStatus;
  idCliente?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ChangeOrderStatusPayload {
  estadoNuevo: OrderStatus;
  motivo?: string;
}

/**
 * Gestión de Devoluciones totales o parciales por línea (RF-07).
 */
export interface ReturnHeader {
  IDDevolucion: number;
  IDPedido: number;
  IDUsuarioSolicita: number;
  NombreCliente?: string;
  EstadoDevolucion: ReturnStatus;
  MotivoSolicitud: string;
  ObservacionResolucion?: string | null;
  MontoTotalDevuelto: number;
  IDUsuarioResuelve?: number | null;
  NombreUsuarioResuelve?: string | null;
  FechaSolicitud: string;
  FechaResolucion?: string | null;
}

export interface ReturnLineItem {
  IDDevolucionDetalle: number;
  IDDevolucion: number;
  IDPedidoDetalle?: number;
  IDVariante: number;
  SKU: string;
  NombreVariante: string;
  NombreProducto: string;
  CantidadDevuelta: number;
  PrecioUnitarioReembolso: number;
  SubtotalReembolso: number;
}

export interface ReturnDetailData {
  devolucion: ReturnHeader;
  detalles: ReturnLineItem[];
}

export interface ReturnFilters extends PaginationParams {
  estado?: ReturnStatus;
  idPedido?: number;
  idCliente?: number;
}

export interface RequestReturnPayload {
  idPedido: number;
  motivo: string;
  items: Array<{
    idVariante: number;
    cantidad: number;
  }>;
}

export interface ResolveReturnPayload {
  nuevoEstado: 'APROBADA' | 'RECHAZADA';
  observacion?: string;
}
