import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { catalogService } from '../api/catalog.api';
import type { ProductVariant } from '../types';

export const PRODUCT_DETAIL_QUERY_KEY = ['catalog', 'product-detail'] as const;

/**
 * Custom Hook para la vista de detalle de producto y selector interactivo de variantes (RF-02).
 * Actualiza en tiempo real precio, disponibilidad (`StockDisponible`), SKU y atributos.
 */
export function useProductDetail(idProducto: number) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const detailQuery = useQuery({
    queryKey: [...PRODUCT_DETAIL_QUERY_KEY, idProducto],
    queryFn: () => catalogService.getProductById(idProducto, false),
    enabled: Number.isFinite(idProducto) && idProducto > 0,
  });

  const activeVariants = useMemo<ProductVariant[]>(() => {
    const raw = detailQuery.data?.variantes ?? [];
    return raw.filter((v) => v.Activo);
  }, [detailQuery.data?.variantes]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (activeVariants.length === 0) return null;
    if (selectedVariantId !== null) {
      const found = activeVariants.find((v) => v.IDVariante === selectedVariantId);
      if (found) return found;
    }
    // Por defecto selecciona la primera variante con existencia disponible, o la primera activa
    return activeVariants.find((v) => v.StockDisponible > 0) ?? activeVariants[0] ?? null;
  }, [activeVariants, selectedVariantId]);

  const handleSelectVariant = (idVariante: number) => {
    setSelectedVariantId(idVariante);
    setQuantity(1);
  };

  return {
    product: detailQuery.data?.producto ?? null,
    variants: activeVariants,
    selectedVariant,
    selectVariant: handleSelectVariant,
    quantity,
    setQuantity,
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    error: detailQuery.error ? getApiErrorMessage(detailQuery.error) : null,
    isEmpty: !detailQuery.isLoading && !detailQuery.isError && !detailQuery.data?.producto,
    refetch: detailQuery.refetch,
  };
}
