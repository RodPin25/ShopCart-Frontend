/**
 * Estructura genérica de paginación devuelta por los Stored Procedures del backend.
 */
export interface PaginatedData<T> {
  items: T[];
  totalRegistros: number;
  numeroPagina: number | string;
  tamanoPagina: number | string;
  totalPaginas: number;
}

/**
 * Parámetros estándar de paginación para peticiones GET.
 */
export interface PaginationParams {
  numeroPagina?: number;
  tamanoPagina?: number;
}

/**
 * Estado unificado para hooks asíncronos (cumple RF sobre estados visibles: carga, vacío y error).
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
}
