import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PaginationParams } from '../types';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  /**
   * Si es `true`, sincroniza `page` y `pageSize` con los query params de la URL
   * para conservar el estado al recargar o compartir enlaces (RF-02).
   */
  syncWithUrl?: boolean;
  pageParamKey?: string;
  pageSizeParamKey?: string;
}

export interface PaginationComputedMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  startItem: number;
  endItem: number;
}

export interface UsePaginationReturn {
  numeroPagina: number;
  tamanoPagina: number;
  paginationParams: Required<PaginationParams>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: (totalPages?: number) => void;
  prevPage: () => void;
  resetPage: () => void;
  getMeta: (totalRegistros?: number, totalPaginas?: number) => PaginationComputedMeta;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Hook transversal para gestionar paginación del lado del servidor (`numeroPagina`, `tamanoPagina`)
 * con soporte opcional de sincronización en la URL (`useSearchParams`).
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 12,
    syncWithUrl = false,
    pageParamKey = 'pagina',
    pageSizeParamKey = 'limite',
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [localPage, setLocalPage] = useState<number>(initialPage);
  const [localPageSize, setLocalPageSize] = useState<number>(initialPageSize);

  const numeroPagina = syncWithUrl
    ? parsePositiveInt(searchParams.get(pageParamKey), initialPage)
    : localPage;

  const tamanoPagina = syncWithUrl
    ? parsePositiveInt(searchParams.get(pageSizeParamKey), initialPageSize)
    : localPageSize;

  const setPage = useCallback(
    (nextPageNumber: number) => {
      const safePage = Math.max(1, Math.floor(nextPageNumber));
      if (syncWithUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (safePage === initialPage) {
              next.delete(pageParamKey);
            } else {
              next.set(pageParamKey, String(safePage));
            }
            return next;
          },
          { replace: true },
        );
      } else {
        setLocalPage(safePage);
      }
    },
    [initialPage, pageParamKey, setSearchParams, syncWithUrl],
  );

  const setPageSize = useCallback(
    (nextSize: number) => {
      const safeSize = Math.max(1, Math.floor(nextSize));
      if (syncWithUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (safeSize === initialPageSize) {
              next.delete(pageSizeParamKey);
            } else {
              next.set(pageSizeParamKey, String(safeSize));
            }
            // Al cambiar el tamaño de página, volvemos siempre a la página 1
            next.delete(pageParamKey);
            return next;
          },
          { replace: true },
        );
      } else {
        setLocalPageSize(safeSize);
        setLocalPage(1);
      }
    },
    [initialPageSize, pageParamKey, pageSizeParamKey, setSearchParams, syncWithUrl],
  );

  const nextPage = useCallback(
    (totalPages?: number) => {
      if (totalPages !== undefined && numeroPagina >= totalPages) {
        return;
      }
      setPage(numeroPagina + 1);
    },
    [numeroPagina, setPage],
  );

  const prevPage = useCallback(() => {
    if (numeroPagina <= 1) return;
    setPage(numeroPagina - 1);
  }, [numeroPagina, setPage]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const getMeta = useCallback(
    (totalRegistros = 0, totalPaginas = 0): PaginationComputedMeta => {
      const safeTotalItems = Math.max(0, totalRegistros);
      const computedTotalPages =
        totalPaginas > 0
          ? totalPaginas
          : safeTotalItems > 0
            ? Math.ceil(safeTotalItems / tamanoPagina)
            : 1;

      const startItem = safeTotalItems === 0 ? 0 : (numeroPagina - 1) * tamanoPagina + 1;
      const endItem = Math.min(safeTotalItems, numeroPagina * tamanoPagina);

      return {
        currentPage: numeroPagina,
        pageSize: tamanoPagina,
        totalItems: safeTotalItems,
        totalPages: computedTotalPages,
        hasPrevPage: numeroPagina > 1,
        hasNextPage: numeroPagina < computedTotalPages,
        startItem,
        endItem,
      };
    },
    [numeroPagina, tamanoPagina],
  );

  const paginationParams = useMemo(
    () => ({
      numeroPagina,
      tamanoPagina,
    }),
    [numeroPagina, tamanoPagina],
  );

  return {
    numeroPagina,
    tamanoPagina,
    paginationParams,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    resetPage,
    getMeta,
  };
}

export type UrlParamPrimitive = string | number | boolean | undefined | null;

/**
 * Hook para sincronizar filtros de búsqueda/tablas directamente con los Query Params de la URL.
 * Al actualizar un filtro distinto a `numeroPagina`, reinicia automáticamente la página a 1.
 */
export function useUrlFilters<T extends Record<string, UrlParamPrimitive>>(
  defaults: T,
  pageKey: keyof T = 'numeroPagina' as keyof T,
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<T>(() => {
    const result = { ...defaults };

    (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
      const rawValue = searchParams.get(String(key));
      if (rawValue === null || rawValue === '') {
        return;
      }

      const defaultValue = defaults[key];
      if (typeof defaultValue === 'number') {
        const parsed = Number(rawValue);
        if (!Number.isNaN(parsed)) {
          result[key] = parsed as T[keyof T];
        }
      } else if (typeof defaultValue === 'boolean') {
        if (rawValue === 'true' || rawValue === '1') {
          result[key] = true as T[keyof T];
        } else if (rawValue === 'false' || rawValue === '0') {
          result[key] = false as T[keyof T];
        }
      } else {
        result[key] = rawValue as T[keyof T];
      }
    });

    return result;
  }, [defaults, searchParams]);

  const setFilters = useCallback(
    (patch: Partial<T>, options: { resetPage?: boolean } = { resetPage: true }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          (Object.keys(patch) as Array<keyof T>).forEach((key) => {
            const value = patch[key];
            const defaultValue = defaults[key];

            if (value === undefined || value === null || value === '' || value === defaultValue) {
              next.delete(String(key));
            } else {
              next.set(String(key), String(value));
            }
          });

          const isChangingPageExplicitly = Object.prototype.hasOwnProperty.call(patch, pageKey);
          if (options.resetPage !== false && !isChangingPageExplicitly && pageKey) {
            next.delete(String(pageKey));
          }

          return next;
        },
        { replace: true },
      );
    },
    [defaults, pageKey, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    filters,
    setFilters,
    resetFilters,
  };
}
