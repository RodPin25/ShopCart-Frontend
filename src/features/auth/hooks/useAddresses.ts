import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import { addressesService } from '../api/auth.api';
import type { AddressPayload } from '../types';

export const ADDRESSES_QUERY_KEY = ['auth', 'addresses'] as const;

/**
 * Custom Hook que encapsula las consultas y mutaciones de la libreta de direcciones
 * del usuario autenticado (RF-01 y RF-06).
 */
export function useAddresses(enabled = true) {
  const queryClient = useQueryClient();

  const addressesQuery = useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () => addressesService.listMyAddresses(),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: (payload: AddressPayload) => addressesService.createAddress(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ idDireccion, payload }: { idDireccion: number; payload: AddressPayload }) =>
      addressesService.updateAddress(idDireccion, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idDireccion: number) => addressesService.deleteAddress(idDireccion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });

  const setPrincipalMutation = useMutation({
    mutationFn: (idDireccion: number) => addressesService.setPrincipalAddress(idDireccion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });

  const addresses = addressesQuery.data ?? [];
  const principalAddress = addresses.find((addr) => addr.EsPrincipal) ?? addresses[0] ?? null;

  return {
    addresses,
    principalAddress,
    isLoading: addressesQuery.isLoading,
    isError: addressesQuery.isError,
    error: addressesQuery.error ? getApiErrorMessage(addressesQuery.error) : null,
    isEmpty: !addressesQuery.isLoading && !addressesQuery.isError && addresses.length === 0,
    refetch: addressesQuery.refetch,
    createAddress: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAddress: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteAddress: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    setPrincipalAddress: setPrincipalMutation.mutateAsync,
    isSettingPrincipal: setPrincipalMutation.isPending,
  };
}
