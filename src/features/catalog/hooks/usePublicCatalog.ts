import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { useDebounce, useUrlFilters } from '../../../hooks';
import { catalogService } from '../api/catalog.api';
import type { ProductFilters, ProductSortOrder } from '../types';

export const PUBLIC_CATEGORIES_QUERY_KEY = ['catalog', 'categories', 'public'] as const;
export const PUBLIC_PRODUCTS_QUERY_KEY = ['catalog', 'products', 'public'] as const;

const DEFAULT_URL_FILTERS = {
  busqueda: '',
  idCategoria: 0,
  precioMinimo: 0,
  precioMaximo: 0,
  soloDisponibles: false,
  ordenarPor: 'RECIENTES' as string,
  numeroPagina: 1,
  tamanoPagina: 12,
};

/**
 * Custom Hook para el Catálogo Público de Productos (RF-02).
 * Sincroniza búsqueda (con debounce), categoría, rango de precio, disponibilidad,
 * ordenamiento y paginación directamente con los Query Params de la URL.
 */
export function usePublicCatalog() {
  const { filters: urlFilters, setFilters, resetFilters } = useUrlFilters(
    DEFAULT_URL_FILTERS,
    'numeroPagina',
  );

  const debouncedSearch = useDebounce(urlFilters.busqueda.trim(), 350);

  const apiFilters = useMemo<ProductFilters>(
    () => ({
      busqueda: debouncedSearch || undefined,
      idCategoria: urlFilters.idCategoria > 0 ? urlFilters.idCategoria : undefined,
      precioMinimo: urlFilters.precioMinimo > 0 ? urlFilters.precioMinimo : undefined,
      precioMaximo: urlFilters.precioMaximo > 0 ? urlFilters.precioMaximo : undefined,
      soloDisponibles: urlFilters.soloDisponibles ? true : undefined,
      soloActivos: true,
      ordenarPor: (urlFilters.ordenarPor as ProductSortOrder) || 'RECIENTES',
      numeroPagina: urlFilters.numeroPagina,
      tamanoPagina: urlFilters.tamanoPagina,
    }),
    [
      debouncedSearch,
      urlFilters.idCategoria,
      urlFilters.numeroPagina,
      urlFilters.ordenarPor,
      urlFilters.precioMaximo,
      urlFilters.precioMinimo,
      urlFilters.soloDisponibles,
      urlFilters.tamanoPagina,
    ],
  );

  const categoriesQuery = useQuery({
    queryKey: PUBLIC_CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.listCategories(true),
    staleTime: 3 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: [...PUBLIC_PRODUCTS_QUERY_KEY, apiFilters],
    queryFn: () => catalogService.listProducts(apiFilters),
  });

  const items = productsQuery.data?.items ?? [];
  const totalRegistros = productsQuery.data?.totalRegistros ?? 0;
  const totalPaginas = productsQuery.data?.totalPaginas ?? 1;

  const hasActiveFilters = Boolean(
    urlFilters.busqueda ||
      urlFilters.idCategoria > 0 ||
      urlFilters.precioMinimo > 0 ||
      urlFilters.precioMaximo > 0 ||
      urlFilters.soloDisponibles ||
      urlFilters.ordenarPor !== 'RECIENTES',
  );

  return {
    categories: categoriesQuery.data ?? [],
    products: items,
    totalRegistros,
    totalPaginas,
    filters: urlFilters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    isLoading: productsQuery.isLoading,
    isFetching: productsQuery.isFetching,
    isError: productsQuery.isError,
    error: productsQuery.error ? getApiErrorMessage(productsQuery.error) : null,
    isEmpty: !productsQuery.isLoading && !productsQuery.isError && items.length === 0,
    refetch: productsQuery.refetch,
  };
}
