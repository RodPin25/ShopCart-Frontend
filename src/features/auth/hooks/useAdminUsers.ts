import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../config/api';
import type { RoleId } from '../../../config/constants';
import { useDebounce, usePagination } from '../../../hooks';
import { usersService } from '../api/auth.api';
import type { CreateUserByAdminPayload, UpdateUserStatusPayload } from '../types';

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;
export const ADMIN_ROLES_QUERY_KEY = ['admin', 'roles'] as const;

/**
 * Custom Hook para la administración de usuarios y roles del lado del servidor (RF-01 - Solo Admin).
 * Incluye búsqueda con debounce, filtro por rol y estado activo, paginación y mutaciones sin borrado físico.
 */
export function useAdminUsers() {
  const queryClient = useQueryClient();
  const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleId | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  const debouncedSearch = useDebounce(searchTerm.trim(), 350);

  const filters = {
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    busqueda: debouncedSearch || undefined,
    idRol: roleFilter,
    activo: statusFilter,
  };

  const usersQuery = useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, filters],
    queryFn: () => usersService.listUsers(filters),
  });

  const rolesQuery = useQuery({
    queryKey: ADMIN_ROLES_QUERY_KEY,
    queryFn: () => usersService.listRoles(),
    staleTime: 5 * 60 * 1000,
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: CreateUserByAdminPayload) => usersService.createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      idUsuario,
      payload,
    }: {
      idUsuario: number;
      payload: UpdateUserStatusPayload;
    }) => usersService.updateUserStatus(idUsuario, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });

  const items = usersQuery.data?.items ?? [];
  const totalRegistros = usersQuery.data?.totalRegistros ?? 0;
  const totalPaginas = usersQuery.data?.totalPaginas ?? 1;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    pagination.resetPage();
  };

  const handleRoleFilterChange = (roleId: RoleId | undefined) => {
    setRoleFilter(roleId);
    pagination.resetPage();
  };

  const handleStatusFilterChange = (activo: boolean | undefined) => {
    setStatusFilter(activo);
    pagination.resetPage();
  };

  return {
    users: items,
    roles: rolesQuery.data ?? [],
    totalRegistros,
    totalPaginas,
    numeroPagina: pagination.numeroPagina,
    tamanoPagina: pagination.tamanoPagina,
    setPage: pagination.setPage,
    searchTerm,
    setSearchTerm: handleSearchChange,
    roleFilter,
    setRoleFilter: handleRoleFilterChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error ? getApiErrorMessage(usersQuery.error) : null,
    isEmpty: !usersQuery.isLoading && !usersQuery.isError && items.length === 0,
    refetch: usersQuery.refetch,
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    updateUserStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
