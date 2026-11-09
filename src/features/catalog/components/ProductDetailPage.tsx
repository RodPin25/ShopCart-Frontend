import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Tag,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatGTQ } from '../../../config/constants';
import { useCart } from '../../../context';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageLoader,
} from '../../../components';
import { useProductDetail } from '../hooks/useProductDetail';

export function ProductDetailPage() {
  const { idProducto } = useParams<{ idProducto: string }>();
  const numericId = Number(idProducto);

  const {
    product,
    variants,
    selectedVariant,
    selectVariant,
    quantity,
    setQuantity,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,
  } = useProductDetail(numericId);

  const {
    addItem,
    isMutating,
    getItemQuantityInCart,
    openDrawer,
  } = useCart();

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (isLoading) {
    return <PageLoader label="Cargando detalles y variantes del producto..." />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          message={error ?? 'Error al cargar la información del producto.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (isEmpty || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Producto no disponible"
          description="El producto solicitado no existe o fue desactivado del catálogo."
          action={
            <Link to="/">
              <Button variant="primary">Volver al catálogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const quantityInCart = selectedVariant ? getItemQuantityInCart(selectedVariant.IDVariante) : 0;
  const maxAddable = selectedVariant
    ? Math.max(0, selectedVariant.StockDisponible - quantityInCart)
    : 0;
  const canAdd = Boolean(selectedVariant && selectedVariant.StockDisponible > 0 && maxAddable >= quantity);

  const handleAddToCart = async () => {
    if (!selectedVariant || !canAdd) return;
    setFeedback(null);
    const ok = await addItem(selectedVariant.IDVariante, quantity);
    if (ok) {
      setFeedback({
        type: 'success',
        message: `Se agregaron ${quantity} unidad(es) de "${selectedVariant.NombreVariante}" al carrito.`,
      });
      setQuantity(1);
      openDrawer();
    } else {
      setFeedback({
        type: 'error',
        message: 'No se pudo agregar la variante al carrito. Verifica la existencia disponible.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:text-[#E31E24] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Tarjeta Visual del Producto y Especificaciones de la Variante */}
        <div className="lg:col-span-5 space-y-4">
          <Card accent="red" className="p-8 text-center space-y-5">
            <div className="flex items-center justify-between">
              <Badge variant="navy">{product.NombreCategoria}</Badge>
              {selectedVariant && (
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  SKU: {selectedVariant.SKU}
                </span>
              )}
            </div>

            <div className="py-12 rounded-2xl bg-slate-100 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] flex flex-col items-center justify-center gap-3">
              <div className="w-24 h-24 rounded-3xl bg-[#0A2259] dark:bg-[#E31E24] text-white flex items-center justify-center text-3xl font-extrabold shadow-lg">
                {product.NombreProducto.slice(0, 2).toUpperCase()}
              </div>
              {selectedVariant && (
                <p className="text-sm font-bold text-[#0A2259] dark:text-white px-4">
                  {selectedVariant.NombreVariante}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#E31E24]" />
              <span>Precio garantizado en Quetzales (IVA 12% incluido)</span>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Selector Interactivo de Variantes y Compra (RF-02 y RF-04) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2 border-b border-slate-200 dark:border-[#1E2D4A] pb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white">
              {product.NombreProducto}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.Descripcion || 'Selecciona una variante para consultar su precio exacto y disponibilidad inmediata.'}
            </p>
          </div>

          {feedback && (
            <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          )}

          {/* Panel de Precio y Disponibilidad en Tiempo Real de la Variante Seleccionada */}
          {selectedVariant ? (
            <Card accent="blue" className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Precio de variante seleccionada (IVA 12% incluido)
                  </span>
                  <div className="text-3xl font-extrabold text-[#0A2259] dark:text-white mt-0.5">
                    {formatGTQ(selectedVariant.Precio)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sin IVA: {formatGTQ(selectedVariant.PrecioSinIVA)} · IVA (12%):{' '}
                    {formatGTQ(selectedVariant.MontoIVAUnitario)}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  {selectedVariant.StockDisponible > 0 ? (
                    <Badge variant="success">
                      <PackageCheck className="w-3.5 h-3.5" /> {selectedVariant.StockDisponible}{' '}
                      unidades disponibles
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <PackageX className="w-3.5 h-3.5" /> Sin existencia disponible
                    </Badge>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Físico: {selectedVariant.StockFisico} · Reservado: {selectedVariant.StockReservado}
                  </p>
                </div>
              </div>

              {/* Atributos dinámicos de la variante (Talla, Color, etc.) */}
              {selectedVariant.atributos && selectedVariant.atributos.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-[#1E2D4A]">
                  {selectedVariant.atributos.map((attr) => (
                    <Badge key={attr.IDVarianteAtributo} variant="neutral">
                      <Tag className="w-3 h-3 text-[#E31E24]" />
                      <span>
                        {attr.Clave}: <strong>{attr.Valor}</strong>
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Alert variant="warning">
              Este producto aún no tiene variantes activas configuradas.
            </Alert>
          )}

          {/* Selector Interactivo de Variantes (RF-02) */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
              Selecciona una Variante ({variants.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variants.map((variant) => {
                const isSelected = selectedVariant?.IDVariante === variant.IDVariante;
                const hasStock = variant.StockDisponible > 0;

                return (
                  <button
                    key={variant.IDVariante}
                    type="button"
                    onClick={() => selectVariant(variant.IDVariante)}
                    className={clsx(
                      'text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2',
                      isSelected
                        ? 'border-[#E31E24] bg-[#E31E24]/5 dark:bg-[#E31E24]/10'
                        : 'border-slate-200 dark:border-[#1E2D4A] bg-white dark:bg-[#111927] hover:border-[#0A2259] dark:hover:border-slate-600',
                      !hasStock && 'opacity-65',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-[#0A2259] dark:text-white">
                          {variant.NombreVariante}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400">SKU: {variant.SKU}</p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#E31E24] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {variant.atributos && variant.atributos.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {variant.atributos.map((a) => (
                          <span
                            key={a.IDVarianteAtributo}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18243A] text-slate-600 dark:text-slate-300"
                          >
                            {a.Clave}: {a.Valor}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1E2D4A]">
                      <span className="text-sm font-extrabold text-[#0A2259] dark:text-white">
                        {formatGTQ(variant.Precio)}
                      </span>
                      <span
                        className={clsx(
                          'text-[11px] font-bold',
                          hasStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500',
                        )}
                      >
                        {hasStock ? `${variant.StockDisponible} disp.` : 'Agotado'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Control de Cantidad con bloqueo por StockDisponible (RF-04) */}
          {selectedVariant && (
            <div className="pt-4 border-t border-slate-200 dark:border-[#1E2D4A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cantidad a agregar
                </span>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-slate-300 dark:border-[#1E2D4A] bg-white dark:bg-[#0F1829] p-1">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#0A2259] dark:text-white hover:bg-slate-100 dark:hover:bg-[#162238] disabled:opacity-40 cursor-pointer"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-extrabold text-sm">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= maxAddable}
                      onClick={() => setQuantity((q) => Math.min(maxAddable, q + 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#0A2259] dark:text-white hover:bg-slate-100 dark:hover:bg-[#162238] disabled:opacity-40 cursor-pointer"
                      aria-label="Incrementar cantidad"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {quantityInCart > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Ya tienes <strong>{quantityInCart}</strong> en tu carrito (máx. adicional:{' '}
                      <strong>{maxAddable}</strong>)
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                disabled={!canAdd}
                isLoading={isMutating}
                onClick={() => void handleAddToCart()}
                leftIcon={<ShoppingCart className="w-5 h-5" />}
              >
                {selectedVariant.StockDisponible <= 0
                  ? 'Sin stock disponible'
                  : maxAddable <= 0
                    ? 'Límite de stock en carrito'
                    : `Agregar por ${formatGTQ(selectedVariant.Precio * quantity)}`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
