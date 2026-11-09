import { useCallback, useState } from 'react';

export interface UseDisclosureReturn<T = undefined> {
  isOpen: boolean;
  data: T | null;
  open: (payload?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook utilitario para controlar la apertura/cierre de Modales, Drawers y Diálogos de confirmación,
 * permitiendo adjuntar opcionalmente el registro seleccionado (`data`).
 */
export function useDisclosure<T = undefined>(initialOpen = false): UseDisclosureReturn<T> {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {
    if (payload !== undefined) {
      setData(payload);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
}
