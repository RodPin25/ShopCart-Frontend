import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { useDebounce, usePagination } from '../../../hooks';
import { catalogService, inventoryService } from '../api/inventory.api';
import type {
  InventoryAdjustmentPayload,
  KardexMovementType,
  StockItem,
} from '../types';

export const INVENTORY_STOCK_QUERY_KEY = ['admin', 'inventory', 'stock'] as const;
export const INVENTORY_KARDEX_QUERY_KEY = ['admin', 'inventory', 'kardex'] as const;
export const INVENTORY_CATEGORIES_QUERY_KEY = ['admin', 'inventory', 'categories'] as const;

/**
 * Custom Hook para Gestión de Inventario en Tiempo Real y Libro Mayor de Kardex (RF-03):
 * - Consulta paginada de existencias (`StockFisico`, `StockReservado`, `StockDisponible`, `SumaKardex`, `Conciliado`).
 * - Consulta paginada de movimientos de Kardex con filtros por variante, producto, tipo y rango de fechas.
 * - Registro de ajustes manuales (`AJUSTE_ENTRADA` / `AJUSTE_SALIDA`) con motivo obligatorio y bloqueo de stock negativo.
 * - Barrido de reservas temporales expiradas (TTL 15 min).
 */
export function useInventory() {
  const queryClient = useQueryClient();

  const stockPagination = usePagination({ initialPage: 1, initialPageSize: 12 });
  const kardexPagination = usePagination({ initialPage: 1, initialPageSize: 15 });

  // Filtros de Existencias
  const [busqueda, setBusqueda] = useState<string>('');
  const debouncedBusqueda = useDebounce(busqueda, 350);
  const [idCategoria, setIdCategoria] = useState<number | undefined>(undefined);
  const [soloBajoStock, setSoloBajoStock] = useState<boolean>(false);
  const [umbralBajoStock, setUmbralBajoStock] = useState<number>(5);

  // Filtros de Kardex
  const [kardexIdVariante, setKardexIdVariante] = useState<number | undefined>(undefined);
  const [kardexIdProducto, setKardexIdProducto] = useState<number | undefined>(undefined);
  const [kardexTipoMovimiento, setKardexTipoMovimiento] = useState<
    KardexMovementType | undefined
  >(undefined);
  const [kardexFechaInicio, setKardexFechaInicio] = useState<string>('');
  const [kardexFechaFin, setKardexFechaFin] = useState<string>('');

  const stockFilters = {
    numeroPagina: stockPagination.numeroPagina,
    tamanoPagina: stockPagination.tamanoPagina,
    busqueda: debouncedBusqueda.trim() || undefined,
    idCategoria,
    soloBajoStock,
    umbralBajoStock,
  };

  const kardexFilters = {
    numeroPagina: kardexPagination.numeroPagina,
    tamanoPagina: kardexPagination.tamanoPagina,
    idVariante: kardexIdVariante,
    idProducto: kardexIdProducto,
    tipoMovimiento: kardexTipoMovimiento,
    fechaInicio: kardexFechaInicio || undefined,
    fechaFin: kardexFechaFin || undefined,
  };

  const categoriesQuery = useQuery({
    queryKey: INVENTORY_CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.listCategories(true),
  });

  const stockQuery = useQuery({
    queryKey: [...INVENTORY_STOCK_QUERY_KEY, stockFilters],
    queryFn: () => inventoryService.listStock(stockFilters),
  });

  const kardexQuery = useQuery({
    queryKey: [...INVENTORY_KARDEX_QUERY_KEY, kardexFilters],
    queryFn: () => inventoryService.getKardex(kardexFilters),
  });

  const invalidateInventory = () => {
    void queryClient.invalidateQueries({ queryKey: INVENTORY_STOCK_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: INVENTORY_KARDEX_QUERY_KEY });
  };

  const registerAdjustmentMutation = useMutation({
    mutationFn: (payload: InventoryAdjustmentPayload) =>
      inventoryService.registerAdjustment(payload),
    onSuccess: invalidateInventory,
  });

  const releaseExpiredMutation = useMutation({
    mutationFn: () => inventoryService.releaseExpiredReservations(),
    onSuccess: invalidateInventory,
  });

  const stockItems: StockItem[] = stockQuery.data?.items ?? [];
  const kardexItems = kardexQuery.data?.items ?? [];

  return {
    categories: categoriesQuery.data ?? [],

    // Stock
    stockItems,
    stockTotalRegistros: stockQuery.data?.totalRegistros ?? 0,
    stockTotalPaginas: stockQuery.data?.totalPaginas ?? 1,
    stockPage: stockPagination.numeroPagina,
    stockPageSize: stockPagination.tamanoPagina,
    setStockPage: stockPagination.setPage,
    busqueda,
    setBusqueda: (val: string) => {
      setBusqueda(val);
      stockPagination.resetPage();
    },
    idCategoria,
    setIdCategoria: (val: number | undefined) => {
      setIdCategoria(val);
      stockPagination.resetPage();
    },
    soloBajoStock,
    setSoloBajoStock: (val: boolean) => {
      setSoloBajoStock(val);
      stockPagination.resetPage();
    },
    umbralBajoStock,
    setUmbralBajoStock: (val: number) => {
      setUmbralBajoStock(Math.max(0, val));
      stockPagination.resetPage();
    },
    resetStockFilters: () => {
      setBusqueda('');
      setIdCategoria(undefined);
      setSoloBajoStock(false);
      setUmbralBajoStock(5);
      stockPagination.resetPage();
    },
    isLoadingStock: stockQuery.isLoading,
    isErrorStock: stockQuery.isError,
    errorStock: stockQuery.error ? getApiErrorMessage(stockQuery.error) : null,
    isEmptyStock: !stockQuery.isLoading && !stockQuery.isError && stockItems.length === 0,
    refetchStock: stockQuery.refetch,

    // Kardex
    kardexItems,
    kardexTotalRegistros: kardexQuery.data?.totalRegistros ?? 0,
    kardexTotalPaginas: kardexQuery.data?.totalPaginas ?? 1,
    kardexPage: kardexPagination.numeroPagina,
    kardexPageSize: kardexPagination.tamanoPagina,
    setKardexPage: kardexPagination.setPage,
    kardexIdVariante,
    setKardexIdVariante: (val: number | undefined) => {
      setKardexIdVariante(val);
      kardexPagination.resetPage();
    },
    kardexIdProducto,
    setKardexIdProducto: (val: number | undefined) => {
      setKardexIdProducto(val);
      kardexPagination.resetPage();
    },
    kardexTipoMovimiento,
    setKardexTipoMovimiento: (val: KardexMovementType | undefined) => {
      setKardexTipoMovimiento(val);
      kardexPagination.resetPage();
    },
    kardexFechaInicio,
    setKardexFechaInicio: (val: string) => {
      setKardexFechaInicio(val);
      kardexPagination.resetPage();
    },
    kardexFechaFin,
    setKardexFechaFin: (val: string) => {
      setKardexFechaFin(val);
      kardexPagination.resetPage();
    },
    resetKardexFilters: () => {
      setKardexIdVariante(undefined);
      setKardexIdProducto(undefined);
      setKardexTipoMovimiento(undefined);
      setKardexFechaInicio('');
      setKardexFechaFin('');
      kardexPagination.resetPage();
    },
    isLoadingKardex: kardexQuery.isLoading,
    isErrorKardex: kardexQuery.isError,
    errorKardex: kardexQuery.error ? getApiErrorMessage(kardexQuery.error) : null,
    isEmptyKardex:
      !kardexQuery.isLoading && !kardexQuery.isError && kardexItems.length === 0,
    refetchKardex: kardexQuery.refetch,

    // Mutaciones
    registerAdjustment: registerAdjustmentMutation.mutateAsync,
    isRegisteringAdjustment: registerAdjustmentMutation.isPending,
    releaseExpiredReservations: releaseExpiredMutation.mutateAsync,
    isReleasingExpired: releaseExpiredMutation.isPending,
  };
}
