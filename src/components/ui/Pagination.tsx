import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalItems <= 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-[#1E2D4A]">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Mostrando <span className="font-bold text-[#0A2259] dark:text-white">{startItem}</span> a{' '}
        <span className="font-bold text-[#0A2259] dark:text-white">{endItem}</span> de{' '}
        <span className="font-bold text-[#0A2259] dark:text-white">{totalItems}</span> registros
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Anterior
        </Button>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#162238] text-[#0A2259] dark:text-slate-200 border border-slate-200 dark:border-[#1E2D4A]">
          Página {currentPage} de {safeTotalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
