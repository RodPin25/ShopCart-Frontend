import { ENV } from './env';

/**
 * Identificadores y nombres de roles según RF-01 y la base de datos SQL Server.
 */
export const ROLE_IDS = {
  ADMIN: 1,
  OPERADOR: 2,
  CLIENTE: 3,
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

export const ROLE_NAMES = {
  ADMIN: 'Administrador',
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

/**
 * Claves de almacenamiento en localStorage para tokens y sesión de invitado.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'shopcart_access_token',
  REFRESH_TOKEN: 'shopcart_refresh_token',
  USER_PROFILE: 'shopcart_user',
  GUEST_TOKEN: 'shopcart_guest_token',
  CHECKOUT_RESERVATION_EXPIRES_AT: 'shopcart_reservation_expires_at',
} as const;

/**
 * Encabezados HTTP personalizados requeridos por el backend de ShopCart.
 */
export const HTTP_HEADERS = {
  GUEST_TOKEN: 'x-guest-token',
  IDEMPOTENCY_KEY: 'Idempotency-Key',
} as const;

/**
 * Eventos globales del navegador para sincronizar el estado de sesión entre Axios y React.
 */
export const AUTH_EVENTS = {
  SESSION_EXPIRED: 'shopcart:session-expired',
  TOKENS_UPDATED: 'shopcart:tokens-updated',
} as const;

/**
 * Ciclo de vida del pedido (RF-07) y transiciones permitidas desde el panel Operador/Admin.
 */
export const ORDER_STATUS = {
  PENDIENTE: 'PENDIENTE',
  PAGADO: 'PAGADO',
  EN_PREPARACION: 'EN_PREPARACION',
  ENVIADO: 'ENVIADO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

/**
 * Estados de devolución (RF-07)
 */
export const RETURN_STATUS = {
  SOLICITADA: 'SOLICITADA',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
} as const;

export type ReturnStatus = (typeof RETURN_STATUS)[keyof typeof RETURN_STATUS];

/**
 * Módulos auditables en la Bitácora Inmutable (RF-09)
 */
export const AUDIT_MODULES = [
  'USUARIOS',
  'CATEGORIAS',
  'PRODUCTOS',
  'VARIANTES',
  'PRECIOS',
  'INVENTARIO',
  'CUPONES',
  'PEDIDOS',
  'DEVOLUCIONES',
] as const;

export type AuditModule = (typeof AUDIT_MODULES)[number];

export const AUDIT_ACTIONS = ['CREAR', 'MODIFICAR', 'DESACTIVAR'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Diccionario centralizado de endpoints del backend (/api/*)
 */
export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    ROLES: '/users/roles',
    STATUS: (idUsuario: number) => `/users/${idUsuario}/status`,
  },
  ADDRESSES: {
    BASE: '/addresses',
    BY_ID: (idDireccion: number) => `/addresses/${idDireccion}`,
    SET_PRINCIPAL: (idDireccion: number) => `/addresses/${idDireccion}/principal`,
  },
  CATALOG: {
    CATEGORIES: '/catalog/categories',
    CATEGORY_BY_ID: (idCategoria: number) => `/catalog/categories/${idCategoria}`,
    PRODUCTS: '/catalog/products',
    PRODUCT_BY_ID: (idProducto: number) => `/catalog/products/${idProducto}`,
    PRODUCT_STATUS: (idProducto: number) => `/catalog/products/${idProducto}/status`,
    PRODUCT_VARIANTS: (idProducto: number) => `/catalog/products/${idProducto}/variants`,
    VARIANT_BY_ID: (idVariante: number) => `/catalog/variants/${idVariante}`,
    VARIANT_ATTRIBUTES: (idVariante: number) => `/catalog/variants/${idVariante}/attributes`,
    VARIANT_ATTRIBUTE_BY_ID: (idVariante: number, idAtributo: number) =>
      `/catalog/variants/${idVariante}/attributes/${idAtributo}`,
    PRICE_HISTORY: '/catalog/price-history',
  },
  INVENTORY: {
    STOCK: '/inventory/stock',
    KARDEX: '/inventory/kardex',
    ADJUSTMENTS: '/inventory/adjustments',
    RESERVATIONS: '/inventory/reservations',
    RESERVE_CART: '/inventory/reservations/cart',
    RELEASE_RESERVATION: '/inventory/reservations/release',
    RELEASE_EXPIRED: '/inventory/reservations/release-expired',
  },
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM_BY_VARIANT: (idVariante: number) => `/cart/items/${idVariante}`,
    MERGE: '/cart/merge',
  },
  COUPONS: {
    BASE: '/coupons',
    VALIDATE: '/coupons/validate',
    BY_ID: (idCupon: number) => `/coupons/${idCupon}`,
    STATUS: (idCupon: number) => `/coupons/${idCupon}/status`,
  },
  ORDERS: {
    BASE: '/orders',
    CHECKOUT: '/orders/checkout',
    BY_ID: (idPedido: number) => `/orders/${idPedido}`,
    STATUS: (idPedido: number) => `/orders/${idPedido}/status`,
  },
  RETURNS: {
    BASE: '/returns',
    BY_ID: (idDevolucion: number) => `/returns/${idDevolucion}`,
    RESOLVE: (idDevolucion: number) => `/returns/${idDevolucion}/resolve`,
  },
  REPORTS: {
    KPIS: '/reports/kpis',
    SALES_BY_PERIOD: '/reports/sales-by-period',
    SALES_BY_CATEGORY: '/reports/sales-by-category',
    TOP_PRODUCTS: '/reports/top-products',
    ABANDONED_CARTS: '/reports/abandoned-carts',
  },
  AUDIT: {
    BASE: '/audit',
  },
} as const;

/**
 * Redondeo financiero exacto a 2 decimales para evitar errores de punto flotante en JS (RF-04).
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formatea un monto numérico en Quetzales guatemaltecos (GTQ), ej. Q 1,299.00
 */
const gtqFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: ENV.CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatGTQ(amount: number | string | null | undefined): string {
  const numericAmount = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (Number.isNaN(numericAmount)) {
    return 'Q 0.00';
  }
  return gtqFormatter.format(roundCurrency(numericAmount));
}

/**
 * Genera un identificador único compatible con todos los navegadores para:
 * - Token de carrito de invitado (x-guest-token)
 * - Llave de idempotencia en el checkout (Idempotency-Key de 8 a 64 caracteres)
 */
export function generateUniqueKey(prefix = 'sc'): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  return `${prefix}-${randomPart}`.slice(0, 64);
}
