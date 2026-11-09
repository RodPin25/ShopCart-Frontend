import { useRef } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  RhinoHeroIllustration,
  Select,
  Skeleton,
} from '../../../components';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import type { ProductSortOrder } from '../types';
import { ProductCard } from './ProductCard';

export function CatalogPage() {
  const catalogSectionRef = useRef<HTMLElement | null>(null);
  const {
    categories,
    products,
    totalRegistros,
    totalPaginas,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,
  } = usePublicCatalog();

  const scrollToCatalog = (onlyAvailable = false) => {
    if (onlyAvailable) {
      setFilters({ soloDisponibles: true, ordenarPor: 'PRECIO_ASC' });
    } else {
      resetFilters();
    }
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Banner oficial basado en el PDF ("Todo lo que buscas con fuerza de rinoceronte") */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0B111E] transition-colors">
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[48%] bg-sky-50/70 dark:bg-[#0E1E40]/65 -skew-x-12 translate-x-16 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-7 bg-[#E31E24] -skew-x-12 translate-x-3 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.08] text-[#0A2259] dark:text-white">
              Todo lo que buscas
              <span className="block text-[#E31E24]">con fuerza de</span>
              <span className="block text-[#E31E24]">rinoceronte</span>
            </h1>

            <p className="text-base sm:text-lg text-[#0A2259]/80 dark:text-slate-300 max-w-md leading-relaxed">
              Tecnología, hogar, moda y mucho más en un solo lugar. Compra desde tu casa.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button variant="primary" size="lg" onClick={() => scrollToCatalog(true)}>
                Ver ofertas
              </Button>
              <Button variant="secondary" size="lg" onClick={() => scrollToCatalog(false)}>
                Explorar todo
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <RhinoHeroIllustration />
          </div>
        </div>
      </section>

      {/* Franja diagonal tricolor del PDF */}
      <div className="shopcart-stripe-bar" />

      {/* Tres tarjetas de valor del PDF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card accent="blue" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Envíos a todo el país
            </h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Recibe tu pedido en la puerta de tu casa.
            </p>
          </Card>

          <Card accent="red" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">Pago seguro</h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Compra con confianza, siempre.
            </p>
          </Card>

          <Card accent="navy" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Devoluciones fáciles
            </h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Si no te gusta, lo resolvemos.
            </p>
          </Card>
        </div>
      </section>

      {/* Catálogo Público con Filtros en URL y Paginación Server-Side (RF-02) */}
      <section
        ref={catalogSectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-[#E31E24]" />
              Catálogo de Productos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Filtra por categoría, rango de precio en Quetzales (GTQ) y disponibilidad en tiempo real
            </p>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-4 h-4 text-[#E31E24]" />}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Barra de Filtros Sincronizada con URL Query Params */}
        <Card accent="red" className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-2">
              <Input
                label="Búsqueda por texto"
                placeholder="Nombre, descripción o SKU..."
                value={filters.busqueda}
                onChange={(e) => setFilters({ busqueda: e.target.value })}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select
              label="Categoría"
              value={filters.idCategoria || ''}
              onChange={(e) =>
                setFilters({ idCategoria: e.target.value ? Number(e.target.value) : 0 })
              }
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categories.map((cat) => ({
                  value: cat.IDCategoria,
                  label: cat.NombreCategoria,
                })),
              ]}
            />

            <Input
              label="Precio Mín (Q)"
              type="number"
              min={0}
              placeholder="0.00"
              value={filters.precioMinimo > 0 ? filters.precioMinimo : ''}
              onChange={(e) =>
                setFilters({ precioMinimo: e.target.value ? Number(e.target.value) : 0 })
              }
            />

            <Input
              label="Precio Máx (Q)"
              type="number"
              min={0}
              placeholder="Sin límite"
              value={filters.precioMaximo > 0 ? filters.precioMaximo : ''}
              onChange={(e) =>
                setFilters({ precioMaximo: e.target.value ? Number(e.target.value) : 0 })
              }
            />

            <Select
              label="Ordenar por"
              value={filters.ordenarPor}
              onChange={(e) => setFilters({ ordenarPor: e.target.value as ProductSortOrder })}
              options={[
                { value: 'RECIENTES', label: 'Más recientes' },
                { value: 'PRECIO_ASC', label: 'Precio: menor a mayor' },
                { value: 'PRECIO_DESC', label: 'Precio: mayor a menor' },
                { value: 'NOMBRE_ASC', label: 'Nombre: A - Z' },
                { value: 'NOMBRE_DESC', label: 'Nombre: Z - A' },
              ]}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-[#1E2D4A] flex flex-wrap items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.soloDisponibles}
                onChange={(e) => setFilters({ soloDisponibles: e.target.checked })}
                className="w-4 h-4 accent-[#E31E24] rounded"
              />
              <span className="text-xs sm:text-sm font-bold text-[#0A2259] dark:text-slate-200">
                Mostrar únicamente productos con existencia disponible
              </span>
            </label>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total encontrados:{' '}
              <strong className="text-[#0A2259] dark:text-white">{totalRegistros}</strong>
            </span>
          </div>
        </Card>

        {/* Resultados con manejo obligatorio de Loading, Error y Empty */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={idx} className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={error ?? 'No pudimos cargar el catálogo de productos.'}
            onRetry={() => void refetch()}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={<Filter className="w-7 h-7" />}
            title="No encontramos productos con esos filtros"
            description="Intenta cambiar el término de búsqueda, el rango de precios en Quetzales o la categoría seleccionada."
            action={
              <Button variant="primary" size="sm" onClick={resetFilters}>
                Ver todo el catálogo
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.IDProducto} product={product} />
              ))}
            </div>

            <Pagination
              currentPage={filters.numeroPagina}
              totalPages={totalPaginas}
              totalItems={totalRegistros}
              pageSize={filters.tamanoPagina}
              onPageChange={(page) => setFilters({ numeroPagina: page }, { resetPage: false })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
