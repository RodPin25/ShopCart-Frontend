import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { useDebounce, usePagination } from '../../../hooks';
import { catalogService, couponsService } from '../api/coupons.api';
import type { Coupon, CouponPayload, DiscountType } from '../types';

export const ADMIN_COUPONS_QUERY_KEY = ['admin', 'coupons'] as const;
export const ADMIN_COUPON_DETAIL_QUERY_KEY = ['admin', 'coupon-detail'] as const;
export const ADMIN_COUPON_CATEGORIES_QUERY_KEY = ['admin', 'coupons', 'categories'] as const;

/**
 * Custom Hook para la administración de Cupones y Promociones (RF-05 — Solo Administrador):
 * - Listado paginado con filtros por código, tipo de descuento, estado activo y vigencia.
 * - Creación y actualización de cupones (`PORCENTAJE` o `MONTO_FIJO`, vigencia, monto mínimo, categoría opcional, límite total y por cliente).
 * - Activación/desactivación rápida (`PATCH /api/coupons/{idCupon}/status`).
 * - Consulta del historial de usos por cliente y pedido (`GET /api/coupons/{idCupon}`).
 */
export function useAdminCoupons() {
  const queryClient = useQueryClient();
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });

  const [busqueda, setBusqueda] = useState<string>('');
  const debouncedBusqueda = useDebounce(busqueda, 350);
  const [tipoDescuento, setTipoDescuento] = useState<DiscountType | undefined>(undefined);
  const [activo, setActivo] = useState<boolean | undefined>(undefined);
  const [soloVigentes, setSoloVigentes] = useState<boolean>(false);
  const [selectedCouponIdForHistory, setSelectedCouponIdForHistory] = useState<number | null>(
    null,
  );

  const filters = {
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    busqueda: debouncedBusqueda.trim() || undefined,
    tipoDescuento,
    activo,
    soloVigentes,
  };

  const categoriesQuery = useQuery({
    queryKey: ADMIN_COUPON_CATEGORIES_QUERY_KEY,
    queryFn: () => catalogService.listCategories(true),
  });

  const couponsQuery = useQuery({
    queryKey: [...ADMIN_COUPONS_QUERY_KEY, filters],
    queryFn: () => couponsService.listCoupons(filters),
  });

  const couponDetailQuery = useQuery({
    queryKey: [...ADMIN_COUPON_DETAIL_QUERY_KEY, selectedCouponIdForHistory],
    queryFn: () => couponsService.getCouponDetail(selectedCouponIdForHistory!),
    enabled: selectedCouponIdForHistory !== null,
  });

  const invalidateCoupons = () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_COUPONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ADMIN_COUPON_DETAIL_QUERY_KEY });
  };

  const createCouponMutation = useMutation({
    mutationFn: (payload: CouponPayload) => couponsService.createCoupon(payload),
    onSuccess: invalidateCoupons,
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ idCupon, payload }: { idCupon: number; payload: CouponPayload }) =>
      couponsService.updateCoupon(idCupon, payload),
    onSuccess: invalidateCoupons,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ idCupon, nextActivo }: { idCupon: number; nextActivo: boolean }) =>
      couponsService.changeCouponStatus(idCupon, nextActivo),
    onSuccess: invalidateCoupons,
  });

  const coupons: Coupon[] = couponsQuery.data?.items ?? [];

  return {
    categories: categoriesQuery.data ?? [],
    coupons,
    totalRegistros: couponsQuery.data?.totalRegistros ?? 0,
    totalPaginas: couponsQuery.data?.totalPaginas ?? 1,
    currentPage: pagination.numeroPagina,
    pageSize: pagination.tamanoPagina,
    setPage: pagination.setPage,

    busqueda,
    setBusqueda: (val: string) => {
      setBusqueda(val);
      pagination.resetPage();
    },
    tipoDescuento,
    setTipoDescuento: (val: DiscountType | undefined) => {
      setTipoDescuento(val);
      pagination.resetPage();
    },
    activo,
    setActivo: (val: boolean | undefined) => {
      setActivo(val);
      pagination.resetPage();
    },
    soloVigentes,
    setSoloVigentes: (val: boolean) => {
      setSoloVigentes(val);
      pagination.resetPage();
    },
    resetFilters: () => {
      setBusqueda('');
      setTipoDescuento(undefined);
      setActivo(undefined);
      setSoloVigentes(false);
      pagination.resetPage();
    },

    isLoading: couponsQuery.isLoading,
    isError: couponsQuery.isError,
    error: couponsQuery.error ? getApiErrorMessage(couponsQuery.error) : null,
    isEmpty: !couponsQuery.isLoading && !couponsQuery.isError && coupons.length === 0,
    refetch: couponsQuery.refetch,

    // Historial de usos por cupón
    selectedCouponIdForHistory,
    setSelectedCouponIdForHistory,
    selectedCouponDetail: couponDetailQuery.data ?? null,
    isLoadingCouponDetail: couponDetailQuery.isLoading,

    // Mutaciones
    createCoupon: createCouponMutation.mutateAsync,
    isCreating: createCouponMutation.isPending,
    updateCoupon: updateCouponMutation.mutateAsync,
    isUpdating: updateCouponMutation.isPending,
    toggleCouponStatus: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,
  };
}
