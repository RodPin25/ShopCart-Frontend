import { Link } from 'react-router-dom';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { formatGTQ } from '../../../config/constants';
import { Badge } from '../../../components';
import type { CartItem } from '../types';

export interface CartItemRowProps {
  item: CartItem;
  compact?: boolean;
  disabled?: boolean;
  onIncrement: (idVariante: number, currentQty: number, stockDisponible: number) => void;
  onDecrement: (idVariante: number, currentQty: number) => void;
  onRemove: (idVariante: number) => void;
  onNavigate?: () => void;
}

/**
 * Línea de producto en el Carrito (RF-04):
 * Deshabilita estrictamente el botón "+" cuando `item.Cantidad >= item.StockDisponible`.
 */
export function CartItemRow({
  item,
  compact = false,
  disabled = false,
  onIncrement,
  onDecrement,
  onRemove,
  onNavigate,
}: CartItemRowProps) {
  const reachedMaxStock = item.Cantidad >= item.StockDisponible;
  const hasStockIssue = !item.StockSuficiente || item.Cantidad > item.StockDisponible;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#111927] border border-slate-200 dark:border-[#1E2D4A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
      <div className="flex items-start gap-3.5 min-w-0">
        <Link
          to={`/productos/${item.IDProducto}`}
          onClick={onNavigate}
          className="w-14 h-14 rounded-xl bg-[#0A2259]/10 dark:bg-[#182640] text-[#0A2259] dark:text-white font-extrabold text-sm flex items-center justify-center shrink-0"
        >
          {item.NombreProducto.slice(0, 2).toUpperCase()}
        </Link>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/productos/${item.IDProducto}`}
              onClick={onNavigate}
              className="font-extrabold text-sm text-[#0A2259] dark:text-white hover:text-[#E31E24] transition-colors truncate"
            >
              {item.NombreProducto}
            </Link>
            <Badge variant="navy">{item.NombreCategoria}</Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {item.NombreVariante}{' '}
            <span className="font-mono text-[11px] text-slate-400">· SKU: {item.SKU}</span>
          </p>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Unitario: <strong className="text-[#0A2259] dark:text-white">{formatGTQ(item.PrecioUnitario)}</strong>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Stock disp: <strong>{item.StockDisponible}</strong>
            </span>
          </div>

          {hasStockIssue && (
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#E31E24]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                La cantidad supera la existencia disponible ({item.StockDisponible} uds.)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controles de cantidad y subtotal de línea */}
      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#1E2D4A] shrink-0">
        <div className="flex flex-col items-start sm:items-end gap-1">
          <div className="inline-flex items-center rounded-full border border-slate-300 dark:border-[#1E2D4A] bg-slate-50 dark:bg-[#0B111E] p-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDecrement(item.IDVariante, item.Cantidad)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#0A2259] dark:text-white hover:bg-slate-200/70 dark:hover:bg-[#162238] disabled:opacity-40 cursor-pointer"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="w-8 text-center text-xs font-extrabold">{item.Cantidad}</span>

            <button
              type="button"
              disabled={disabled || reachedMaxStock}
              onClick={() => onIncrement(item.IDVariante, item.Cantidad, item.StockDisponible)}
              title={
                reachedMaxStock
                  ? `Máximo disponible alcanzado (${item.StockDisponible} unidades)`
                  : 'Incrementar cantidad'
              }
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#0A2259] dark:text-white hover:bg-slate-200/70 dark:hover:bg-[#162238] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Incrementar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {reachedMaxStock && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Máx. stock disponible
            </span>
          )}
        </div>

        {!compact && (
          <div className="text-right min-w-[95px]">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Subtotal
            </span>
            <span className="text-sm font-extrabold text-[#0A2259] dark:text-white">
              {formatGTQ(item.SubtotalLinea)}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(item.IDVariante)}
          className="p-2 rounded-xl text-slate-400 hover:text-[#E31E24] hover:bg-rose-500/10 transition-colors cursor-pointer"
          aria-label={`Eliminar ${item.NombreVariante} del carrito`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
