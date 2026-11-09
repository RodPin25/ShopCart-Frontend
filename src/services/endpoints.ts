/**
 * Diccionario centralizado de endpoints verificado contra la especificación OpenAPI
 * del backend (`GET http://localhost:3000/api/docs.json`).
 */
export const API_ENDPOINTS = {
  HEALTH: '/health',

  // RF-01: Autenticación y Perfil
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // RF-01: Administración de Usuarios y Roles (Solo Admin)
  USERS: {
    BASE: '/users',
    ROLES: '/users/roles',
    STATUS: (idUsuario: number) => `/users/${idUsuario}/status`,
  },

  // RF-01 & RF-06: Direcciones de Entrega del Cliente
  ADDRESSES: {
    BASE: '/addresses',
    BY_ID: (idDireccion: number) => `/addresses/${idDireccion}`,
    SET_PRINCIPAL: (idDireccion: number) => `/addresses/${idDireccion}/principal`,
  },

  // RF-02: Catálogo de Productos, Categorías, Variantes, Atributos e Historial de Precios
  CATALOG: {
    CATEGORIES: '/catalog/categories',
    CATEGORY_BY_ID: (idCategoria: number) => `/catalog/categories/${idCategoria}`,
    PRODUCTS: '/catalog/products',
    PRODUCT_BY_ID: (idProducto: number) => `/catalog/products/${idProducto}`,
    PRODUCT_STATUS: (idProducto: number) => `/catalog/products/${idProducto}/status`,
    PRODUCT_VARIANTS: (idProducto: number) => `/catalog/products/${idProducto}/variants`,
    VARIANT_BY_ID: (idVariante: number) => `/catalog/variants/${idVariante}`,
    VARIANT_ATTRIBUTES: (idVariante: number) => `/catalog/variants/${idVariante}/attributes`,
    VARIANT_ATTRIBUTE_BY_ID: (idVariante: number, idVarianteAtributo: number) =>
      `/catalog/variants/${idVariante}/attributes/${idVarianteAtributo}`,
    PRICE_HISTORY: '/catalog/price-history',
  },

  // RF-03 & RF-06: Inventario, Kardex, Ajustes Manuales y Reservas Temporales (15 min)
  INVENTORY: {
    STOCK: '/inventory/stock',
    KARDEX: '/inventory/kardex',
    ADJUSTMENTS: '/inventory/adjustments',
    RESERVATIONS: '/inventory/reservations',
    RESERVE_CART: '/inventory/reservations/cart',
    RELEASE_RESERVATION: '/inventory/reservations/release',
    RELEASE_EXPIRED: '/inventory/reservations/release-expired',
  },

  // RF-04: Carrito de Compras (Invitado y Autenticado)
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM_BY_VARIANT: (idVariante: number) => `/cart/items/${idVariante}`,
    MERGE: '/cart/merge',
  },

  // RF-05: Cupones y Promociones
  COUPONS: {
    BASE: '/coupons',
    VALIDATE: '/coupons/validate',
    BY_ID: (idCupon: number) => `/coupons/${idCupon}`,
    STATUS: (idCupon: number) => `/coupons/${idCupon}/status`,
  },

  // RF-06 & RF-07: Checkout Idempotente y Gestión de Pedidos
  ORDERS: {
    BASE: '/orders',
    CHECKOUT: '/orders/checkout',
    BY_ID: (idPedido: number) => `/orders/${idPedido}`,
    STATUS: (idPedido: number) => `/orders/${idPedido}/status`,
  },

  // RF-07: Gestión de Devoluciones Totales o Parciales
  RETURNS: {
    BASE: '/returns',
    BY_ID: (idDevolucion: number) => `/returns/${idDevolucion}`,
    RESOLVE: (idDevolucion: number) => `/returns/${idDevolucion}/resolve`,
  },

  // RF-08: Dashboard Ejecutivo y Reportes Analíticos
  REPORTS: {
    KPIS: '/reports/kpis',
    SALES_BY_PERIOD: '/reports/sales-by-period',
    SALES_BY_CATEGORY: '/reports/sales-by-category',
    TOP_PRODUCTS: '/reports/top-products',
    ABANDONED_CARTS: '/reports/abandoned-carts',
  },

  // RF-09: Bitácora Inmutable de Auditoría
  AUDIT: {
    BASE: '/audit',
  },
} as const;

export default API_ENDPOINTS;
