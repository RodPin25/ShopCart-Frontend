import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { useDebounce, usePagination } from '../../../hooks';
import { catalogService } from '../api/catalog.api';
import type {
  CategoryPayload,
  CreateVariantPayload,
  ProductPayload,
  UpdateVariantPayload,
  VariantAttributePayload,
} from '../types';
import { PRODUCT_DETAIL_QUERY_KEY } from './useProductDetail';
import {
  PUBLIC_CATEGORIES_QUERY_KEY,
  PUBLIC_PRODUCTS_QUERY_KEY,
} from './usePublicCatalog';

export const ADMIN_CATEGORIES_QUERY_KEY = ['admin', 'catalog', 'categories'] as const;
export const ADMIN_PRODUCTS_QUERY_KEY = ['admin', 'catalog', 'products'] as const;
export const ADMIN_PRICE_HISTORY_QUERY_KEY = ['admin', 'catalog', 'price-history'] as const;

/**
 * Custom Hook para la administración completa del Catálogo, Categorías, Variantes,
 * Atributos e Historial de Precios (RF-02 - Solo Administrador).
 */
export function useAdminCatalog() {
  const queryClient = useQueryClient();
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [selectedProductIdForDetail, setSelectedProductIdForDetail] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchTerm.trim(), 350);

  const productFilters = {
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    busqueda: debouncedSearch || undefined,
    idCategoria: categoryFilter,
    soloActivos: false,
  };

  const categoriesQuery = useQuery({
    queryKey: ADMIN_CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.listCategories(false),
  });

  const productsQuery = useQuery({
    queryKey: [...ADMIN_PRODUCTS_QUERY_KEY, productFilters],
    queryFn: () => catalogService.listProducts(productFilters),
  });

  const productDetailQuery = useQuery({
    queryKey: [...PRODUCT_DETAIL_QUERY_KEY, 'admin', selectedProductIdForDetail],
    queryFn: () => catalogService.getProductById(selectedProductIdForDetail!, true),
    enabled: selectedProductIdForDetail !== null,
  });

  const priceHistoryQuery = useQuery({
    queryKey: [...ADMIN_PRICE_HISTORY_QUERY_KEY, selectedProductIdForDetail],
    queryFn: () =>
      catalogService.getPriceHistory(
        selectedProductIdForDetail ? { idProducto: selectedProductIdForDetail } : undefined,
      ),
  });

  const invalidateCatalogQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: PUBLIC_CATEGORIES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: PUBLIC_PRODUCTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: PRODUCT_DETAIL_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ADMIN_PRICE_HISTORY_QUERY_KEY });
  };

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => catalogService.createCategory(payload),
    onSuccess: invalidateCatalogQueries,
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ idCategoria, payload }: { idCategoria: number; payload: CategoryPayload }) =>
      catalogService.updateCategory(idCategoria, payload),
    onSuccess: invalidateCatalogQueries,
  });

  const createProductMutation = useMutation({
    mutationFn: (payload: ProductPayload) => catalogService.createProduct(payload),
    onSuccess: invalidateCatalogQueries,
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ idProducto, payload }: { idProducto: number; payload: ProductPayload }) =>
      catalogService.updateProduct(idProducto, payload),
    onSuccess: invalidateCatalogQueries,
  });

  const changeProductStatusMutation = useMutation({
    mutationFn: ({ idProducto, activo }: { idProducto: number; activo: boolean }) =>
      catalogService.changeProductStatus(idProducto, activo),
    onSuccess: invalidateCatalogQueries,
  });

  const createVariantMutation = useMutation({
    mutationFn: ({
      idProducto,
      payload,
    }: {
      idProducto: number;
      payload: CreateVariantPayload;
    }) => catalogService.createVariant(idProducto, payload),
    onSuccess: invalidateCatalogQueries,
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({
      idVariante,
      payload,
    }: {
      idVariante: number;
      payload: UpdateVariantPayload;
    }) => catalogService.updateVariant(idVariante, payload),
    onSuccess: invalidateCatalogQueries,
  });

  const saveAttributeMutation = useMutation({
    mutationFn: ({
      idVariante,
      payload,
    }: {
      idVariante: number;
      payload: VariantAttributePayload;
    }) => catalogService.saveVariantAttribute(idVariante, payload),
    onSuccess: invalidateCatalogQueries,
  });

  const deleteAttributeMutation = useMutation({
    mutationFn: ({
      idVariante,
      idVarianteAtributo,
    }: {
      idVariante: number;
      idVarianteAtributo: number;
    }) => catalogService.deleteVariantAttribute(idVariante, idVarianteAtributo),
    onSuccess: invalidateCatalogQueries,
  });

  const products = productsQuery.data?.items ?? [];

  return {
    categories: categoriesQuery.data ?? [],
    isLoadingCategories: categoriesQuery.isLoading,
    products,
    totalRegistros: productsQuery.data?.totalRegistros ?? 0,
    totalPaginas: productsQuery.data?.totalPaginas ?? 1,
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    setPage: pagination.setPage,
    searchTerm,
    setSearchTerm: (value: string) => {
      setSearchTerm(value);
      pagination.resetPage();
    },
    categoryFilter,
    setCategoryFilter: (idCategoria: number | undefined) => {
      setCategoryFilter(idCategoria);
      pagination.resetPage();
    },
    selectedProductIdForDetail,
    setSelectedProductIdForDetail,
    selectedProductDetail: productDetailQuery.data ?? null,
    isLoadingProductDetail: productDetailQuery.isLoading,
    priceHistory: priceHistoryQuery.data ?? [],
    isLoadingPriceHistory: priceHistoryQuery.isLoading,
    isLoadingProducts: productsQuery.isLoading,
    isErrorProducts: productsQuery.isError,
    errorProducts: productsQuery.error ? getApiErrorMessage(productsQuery.error) : null,
    isEmptyProducts:
      !productsQuery.isLoading && !productsQuery.isError && products.length === 0,
    refetchProducts: productsQuery.refetch,
    createCategory: createCategoryMutation.mutateAsync,
    isCreatingCategory: createCategoryMutation.isPending,
    updateCategory: updateCategoryMutation.mutateAsync,
    isUpdatingCategory: updateCategoryMutation.isPending,
    createProduct: createProductMutation.mutateAsync,
    isCreatingProduct: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutateAsync,
    isUpdatingProduct: updateProductMutation.isPending,
    changeProductStatus: changeProductStatusMutation.mutateAsync,
    isChangingProductStatus: changeProductStatusMutation.isPending,
    createVariant: createVariantMutation.mutateAsync,
    isCreatingVariant: createVariantMutation.isPending,
    updateVariant: updateVariantMutation.mutateAsync,
    isUpdatingVariant: updateVariantMutation.isPending,
    saveAttribute: saveAttributeMutation.mutateAsync,
    isSavingAttribute: saveAttributeMutation.isPending,
    deleteAttribute: deleteAttributeMutation.mutateAsync,
  };
}
