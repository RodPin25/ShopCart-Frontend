import type { PaginationParams } from './common.types';

/**
 * Categoría del catálogo (SP_Catalogo_ListarCategorias - RF-02).
 */
export interface Category {
  IDCategoria: number;
  NombreCategoria: string;
  Descripcion: string | null;
  Activo: boolean;
  TotalProductosActivos?: number;
  FechaCreacion?: string;
}

export interface CategoryPayload {
  nombreCategoria: string;
  descripcion?: string;
  activo?: boolean;
}

/**
 * Producto resumido en el listado paginado de la tienda (SP_Catalogo_ListarProductos - RF-02).
 */
export interface ProductListItem {
  IDProducto: number;
  IDCategoria: number;
  NombreCategoria: string;
  NombreProducto: string;
  Descripcion: string | null;
  Activo: boolean;
  FechaCreacion: string;
  TotalVariantesActivas: number;
  PrecioDesde: number;
  PrecioHasta: number;
  PrecioDesdeSinIVA: number;
  PrecioDesdeIVA: number;
  StockFisicoTotal: number;
  StockDisponibleTotal: number;
  ImagenPortada?: string | null;
  TieneDisponibilidad: boolean;
}

/**
 * Atributo dinámico de una variante (ej. Talla: M, Color: Negro Cósmico).
 */
export interface VariantAttribute {
  IDVarianteAtributo: number;
  IDVariante: number;
  Clave: string;
  Valor: string;
  Activo: boolean;
}

export interface VariantImage {
  IDVarianteImagen: number;
  IDVariante: number;
  UrlImagen: string;
  EsPrincipal: boolean;
  Orden: number;
  Activo: boolean;
}

export interface VariantImagePayload {
  urlImagen: string;
  esPrincipal?: boolean;
  orden?: number;
}

/**
 * Variante vendible con su propio SKU, precio en GTQ y existencia disponible (RF-02, RF-03).
 */
export interface ProductVariant {
  IDVariante: number;
  IDProducto: number;
  SKU: string;
  NombreVariante: string;
  Precio: number;
  PrecioSinIVA: number;
  MontoIVAUnitario: number;
  StockFisico: number;
  StockReservado: number;
  StockDisponible: number;
  ImagenPrincipal?: string | null;
  Activo: boolean;
  atributos: VariantAttribute[];
  imagenes?: VariantImage[];
}

/**
 * Encabezado del producto maestro en la vista de detalle.
 */
export interface ProductMaster {
  IDProducto: number;
  IDCategoria: number;
  NombreCategoria: string;
  NombreProducto: string;
  Descripcion: string | null;
  Activo: boolean;
  FechaCreacion: string;
}

/**
 * Respuesta completa de `GET /api/catalog/products/{idProducto}`.
 */
export interface ProductDetailData {
  producto: ProductMaster;
  variantes: ProductVariant[];
}

/**
 * Criterios de ordenamiento soportados por `SP_Catalogo_ListarProductos`.
 */
export type ProductSortOrder =
  | 'PRECIO_ASC'
  | 'PRECIO_DESC'
  | 'NOMBRE_ASC'
  | 'NOMBRE_DESC'
  | 'RECIENTES';

/**
 * Filtros de búsqueda, categoría, precio y disponibilidad del catálogo (RF-02).
 */
export interface ProductFilters extends PaginationParams {
  busqueda?: string;
  idCategoria?: number;
  precioMinimo?: number;
  precioMaximo?: number;
  soloDisponibles?: boolean;
  soloActivos?: boolean;
  ordenarPor?: ProductSortOrder;
}

/**
 * Payloads de administración de productos, variantes y atributos (Solo Admin - RF-02).
 */
export interface ProductPayload {
  idCategoria: number;
  nombreProducto: string;
  descripcion?: string;
}

export interface CreateVariantPayload {
  sku: string;
  nombreVariante: string;
  precio: number;
  stockInicial?: number;
  imagenes?: Array<string | VariantImagePayload>;
}

export interface UpdateVariantPayload {
  sku: string;
  nombreVariante: string;
  precio: number;
  activo?: boolean;
}

export interface VariantAttributePayload {
  clave: string;
  valor: string;
}

/**
 * Registro de historial de cambios de precios (`SP_Catalogo_ObtenerHistorialPrecios`).
 */
export interface PriceHistoryItem {
  IDHistorialPrecio: number;
  IDVariante: number;
  SKU: string;
  NombreVariante: string;
  IDProducto: number;
  NombreProducto: string;
  PrecioAnterior: number;
  PrecioNuevo: number;
  IDUsuarioModifico: number;
  NombreUsuarioModifico?: string;
  FechaCambio: string;
}
