import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type {
  Category,
  CategoryPayload,
  CreateVariantPayload,
  PaginatedData,
  PriceHistoryItem,
  ProductDetailData,
  ProductFilters,
  ProductListItem,
  ProductMaster,
  ProductPayload,
  ProductVariant,
  UpdateVariantPayload,
  VariantAttribute,
  VariantAttributePayload,
} from '../types';

/**
 * Servicio modular de Catálogo de Productos, Categorías, Variantes e Historial de Precios (RF-02).
 */
export const catalogService = {
  /**
   * GET /api/catalog/categories
   * Lista las categorías del catálogo (SP_Catalogo_ListarCategorias).
   */
  async listCategories(soloActivas?: boolean): Promise<Category[]> {
    const { data } = await apiClient.get<ApiResponse<Category[]>>(
      API_ENDPOINTS.CATALOG.CATEGORIES,
      { params: soloActivas !== undefined ? { soloActivas } : undefined }
    );
    return data.data;
  },

  /**
   * POST /api/catalog/categories
   * Crea una categoría (SP_Catalogo_CrearCategoria - Solo Admin).
   */
  async createCategory(payload: CategoryPayload): Promise<Category> {
    const { data } = await apiClient.post<ApiResponse<Category>>(
      API_ENDPOINTS.CATALOG.CATEGORIES,
      payload
    );
    return data.data;
  },

  /**
   * PUT /api/catalog/categories/{idCategoria}
   * Actualiza una categoría existente (SP_Catalogo_ActualizarCategoria - Solo Admin).
   */
  async updateCategory(
    idCategoria: number,
    payload: CategoryPayload
  ): Promise<Category> {
    const { data } = await apiClient.put<ApiResponse<Category>>(
      API_ENDPOINTS.CATALOG.CATEGORY_BY_ID(idCategoria),
      payload
    );
    return data.data;
  },

  /**
   * GET /api/catalog/products
   * Lista productos con filtros, búsqueda, ordenamiento y paginación server-side (SP_Catalogo_ListarProductos).
   */
  async listProducts(
    filters: ProductFilters = {}
  ): Promise<PaginatedData<ProductListItem>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<ProductListItem>>>(
      API_ENDPOINTS.CATALOG.PRODUCTS,
      { params: filters }
    );
    return data.data;
  },

  /**
   * GET /api/catalog/products/{idProducto}
   * Obtiene el detalle de un producto con todas sus variantes y atributos (SP_Catalogo_ObtenerDetalleProducto).
   */
  async getProductById(
    idProducto: number,
    incluirInactivos?: boolean
  ): Promise<ProductDetailData> {
    const { data } = await apiClient.get<ApiResponse<ProductDetailData>>(
      API_ENDPOINTS.CATALOG.PRODUCT_BY_ID(idProducto),
      { params: incluirInactivos !== undefined ? { incluirInactivos } : undefined }
    );
    return data.data;
  },

  /**
   * POST /api/catalog/products
   * Crea un producto maestro (SP_Catalogo_CrearProducto - Solo Admin).
   */
  async createProduct(payload: ProductPayload): Promise<ProductMaster> {
    const { data } = await apiClient.post<ApiResponse<ProductMaster>>(
      API_ENDPOINTS.CATALOG.PRODUCTS,
      payload
    );
    return data.data;
  },

  /**
   * PUT /api/catalog/products/{idProducto}
   * Actualiza la información de un producto maestro (SP_Catalogo_ActualizarProducto - Solo Admin).
   */
  async updateProduct(
    idProducto: number,
    payload: ProductPayload
  ): Promise<ProductMaster> {
    const { data } = await apiClient.put<ApiResponse<ProductMaster>>(
      API_ENDPOINTS.CATALOG.PRODUCT_BY_ID(idProducto),
      payload
    );
    return data.data;
  },

  /**
   * PATCH /api/catalog/products/{idProducto}/status
   * Desactiva o reactiva un producto sin borrado físico (SP_Catalogo_CambiarEstadoProducto - Solo Admin).
   */
  async changeProductStatus(
    idProducto: number,
    activo: boolean
  ): Promise<ProductMaster> {
    const { data } = await apiClient.patch<ApiResponse<ProductMaster>>(
      API_ENDPOINTS.CATALOG.PRODUCT_STATUS(idProducto),
      { activo }
    );
    return data.data;
  },

  /**
   * POST /api/catalog/products/{idProducto}/variants
   * Crea una variante vendible con SKU único y stock inicial en Kardex (SP_Catalogo_CrearVariante - Solo Admin).
   */
  async createVariant(
    idProducto: number,
    payload: CreateVariantPayload
  ): Promise<ProductVariant> {
    const { data } = await apiClient.post<ApiResponse<ProductVariant>>(
      API_ENDPOINTS.CATALOG.PRODUCT_VARIANTS(idProducto),
      payload
    );
    return data.data;
  },

  /**
   * PUT /api/catalog/variants/{idVariante}
   * Actualiza SKU, nombre, precio o estado activo de una variante y audita cambios en HistorialPrecios (SP_Catalogo_ActualizarVariante).
   */
  async updateVariant(
    idVariante: number,
    payload: UpdateVariantPayload
  ): Promise<ProductVariant> {
    const { data } = await apiClient.put<ApiResponse<ProductVariant>>(
      API_ENDPOINTS.CATALOG.VARIANT_BY_ID(idVariante),
      payload
    );
    return data.data;
  },

  /**
   * POST /api/catalog/variants/{idVariante}/attributes
   * Crea o actualiza un atributo de variante como Talla o Color (SP_Catalogo_GuardarAtributoVariante).
   */
  async saveVariantAttribute(
    idVariante: number,
    payload: VariantAttributePayload
  ): Promise<VariantAttribute> {
    const { data } = await apiClient.post<ApiResponse<VariantAttribute>>(
      API_ENDPOINTS.CATALOG.VARIANT_ATTRIBUTES(idVariante),
      payload
    );
    return data.data;
  },

  /**
   * DELETE /api/catalog/variants/{idVariante}/attributes/{idVarianteAtributo}
   * Desactiva un atributo de variante (borrado lógico - SP_Catalogo_EliminarAtributoVariante).
   */
  async deleteVariantAttribute(
    idVariante: number,
    idVarianteAtributo: number
  ): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.CATALOG.VARIANT_ATTRIBUTE_BY_ID(idVariante, idVarianteAtributo)
    );
  },

  /**
   * GET /api/catalog/price-history
   * Consulta el historial de cambios de precios por variante o producto (SP_Catalogo_ObtenerHistorialPrecios - Solo Admin).
   */
  async getPriceHistory(params?: {
    idVariante?: number;
    idProducto?: number;
  }): Promise<PriceHistoryItem[]> {
    const { data } = await apiClient.get<ApiResponse<Array<Record<string, unknown>>>>(
      API_ENDPOINTS.CATALOG.PRICE_HISTORY,
      { params }
    );
    const rawList = Array.isArray(data.data) ? data.data : [];
    return rawList.map((item) => ({
      IDHistorialPrecio: Number(item.IDHistorialPrecio ?? 0),
      IDVariante: Number(item.IDVariante ?? 0),
      SKU: String(item.SKU ?? ''),
      NombreVariante: String(item.NombreVariante ?? ''),
      IDProducto: Number(item.IDProducto ?? 0),
      NombreProducto: String(item.NombreProducto ?? ''),
      PrecioAnterior: Number(item.PrecioAnterior ?? 0),
      PrecioNuevo: Number(item.PrecioNuevo ?? 0),
      IDUsuarioModifico: Number(item.IDUsuarioModifico ?? item.IDUsuario ?? 0),
      NombreUsuarioModifico:
        (item.NombreUsuarioModifico as string | undefined) ??
        (item.ModificadoPor as string | undefined),
      FechaCambio: String(
        item.FechaCambio ?? item.FechaModificacion ?? new Date().toISOString()
      ),
    }));
  },
};

export default catalogService;
