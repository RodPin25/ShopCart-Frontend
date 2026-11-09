import { Link } from 'react-router-dom';
import { ArrowRight, Layers, PackageCheck, PackageX } from 'lucide-react';
import { formatGTQ } from '../../../config/constants';
import { Badge, Button, Card } from '../../../components';
import type { ProductListItem } from '../types';

export interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasPriceRange =
    product.PrecioHasta > product.PrecioDesde && product.TotalVariantesActivas > 1;
  const isAvailable = product.TieneDisponibilidad && product.StockDisponibleTotal > 0;

  return (
    <Card
      accent={isAvailable ? 'blue' : 'none'}
      className="flex flex-col justify-between gap-4 hover:shadow-lg hover:border-[#E31E24]/50 transition-all group"
    >
      <div className="space-y-3">
        {/* Cabecera de categoría y disponibilidad */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="navy">{product.NombreCategoria}</Badge>
          {isAvailable ? (
            <Badge variant="success">
              <PackageCheck className="w-3 h-3" /> {product.StockDisponibleTotal} disp.
            </Badge>
          ) : (
            <Badge variant="danger">
              <PackageX className="w-3 h-3" /> Agotado
            </Badge>
          )}
        </div>

        {/* Ilustración / Placeholder estilizado con identidad de marca */}
        <Link
          to={`/productos/${product.IDProducto}`}
          className="block rounded-xl bg-slate-100 dark:bg-[#0D1525] border border-slate-200/70 dark:border-[#1E2D4A] p-6 text-center group-hover:bg-sky-50/60 dark:group-hover:bg-[#13203B] transition-colors"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0A2259]/10 dark:bg-white/10 text-[#0A2259] dark:text-white flex items-center justify-center font-extrabold text-lg">
            {product.NombreProducto.slice(0, 2).toUpperCase()}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#E31E24]" />
            {product.TotalVariantesActivas}{' '}
            {product.TotalVariantesActivas === 1 ? 'variante' : 'variantes'}
          </p>
        </Link>

        {/* Título y descripción */}
        <div className="space-y-1">
          <Link
            to={`/productos/${product.IDProducto}`}
            className="block text-base font-extrabold text-[#0A2259] dark:text-white group-hover:text-[#E31E24] transition-colors line-clamp-1"
          >
            {product.NombreProducto}
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
            {product.Descripcion || 'Producto disponible con múltiples opciones y garantía Shop Cart.'}
          </p>
        </div>
      </div>

      {/* Pie con Precio en GTQ (IVA 12% incluido) y CTA */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-[#1E2D4A] flex items-end justify-between gap-2">
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {hasPriceRange ? 'Desde (IVA incl.)' : 'Precio (IVA incl.)'}
          </span>
          <span className="text-lg font-extrabold text-[#0A2259] dark:text-white">
            {formatGTQ(product.PrecioDesde)}
          </span>
          {hasPriceRange && (
            <span className="block text-[11px] text-slate-400">
              hasta {formatGTQ(product.PrecioHasta)}
            </span>
          )}
        </div>

        <Link to={`/productos/${product.IDProducto}`}>
          <Button
            variant={isAvailable ? 'primary' : 'secondary'}
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {isAvailable ? 'Elegir' : 'Ver detalle'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
