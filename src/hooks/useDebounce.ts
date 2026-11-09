import { useEffect, useState } from 'react';

/**
 * Retrasa la propagación de un valor reactivo hasta que transcurra el tiempo `delayMs`
 * sin nuevos cambios. Ideal para búsquedas del lado del servidor (RF-02, RF-03, RF-08, RF-09)
 * evitando saturar el API en cada pulsación de tecla.
 *
 * @param value Valor reactivo a aplicar debounce
 * @param delayMs Tiempo de espera en milisegundos (por defecto 350ms)
 */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
