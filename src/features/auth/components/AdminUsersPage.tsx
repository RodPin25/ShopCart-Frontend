import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Power, Search, Shield, UserPlus, Users } from 'lucide-react';
import { getApiErrorMessage } from '../../../config/api';
import { ROLE_IDS, type RoleId } from '../../../config/constants';
import { adminCreateUserSchema, type AdminCreateUserFormValues } from '../../../config/schemas';
import { useAuth } from '../../../context';
import { useDisclosure } from '../../../hooks';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
} from '../../../components';
import { useAdminUsers } from '../hooks/useAdminUsers';
import type { User } from '../types';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    totalRegistros,
    totalPaginas,
    numeroPagina,
    tamanoPagina,
    setPage,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    isLoading,
    isError,
    error,
    isEmpty,
    refetch,
    createUser,
    isCreating,
    updateUserStatus,
    isUpdatingStatus,
  } = useAdminUsers();

  const createModal = useDisclosure();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const form = useForm<AdminCreateUserFormValues>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      idRol: ROLE_IDS.OPERADOR,
      nombreCompleto: '',
      correo: '',
      telefono: '',
      password: '',
    },
  });

  const handleOpenCreateModal = () => {
    setFeedback(null);
    form.reset({
      idRol: ROLE_IDS.OPERADOR,
      nombreCompleto: '',
      correo: '',
      telefono: '',
      password: '',
    });
    createModal.open();
  };

  const onSubmitCreate = async (values: AdminCreateUserFormValues) => {
    setFeedback(null);
    try {
      await createUser({
        idRol: values.idRol,
        nombreCompleto: values.nombreCompleto.trim(),
        correo: values.correo.trim(),
        telefono: values.telefono?.trim() || undefined,
        password: values.password,
      });
      setFeedback({
        type: 'success',
        message: `Usuario ${values.correo} creado exitosamente.`,
      });
      createModal.close();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    setFeedback(null);
    try {
      await updateUserStatus({
        idUsuario: targetUser.IDUsuario,
        payload: {
          activo: !targetUser.Activo,
          idRol: targetUser.IDRol,
        },
      });
      setFeedback({
        type: 'success',
        message: `El usuario ${targetUser.NombreCompleto} fue ${
          !targetUser.Activo ? 'reactivado' : 'desactivado'
        }.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleChangeRole = async (targetUser: User, nextRoleId: RoleId) => {
    setFeedback(null);
    try {
      await updateUserStatus({
        idUsuario: targetUser.IDUsuario,
        payload: {
          activo: targetUser.Activo,
          idRol: nextRoleId,
        },
      });
      setFeedback({
        type: 'success',
        message: `Rol de ${targetUser.NombreCompleto} actualizado correctamente.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administra cuentas de Clientes, Operadores y Administradores sin borrado físico (RF-01)
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Nuevo usuario
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Barra de Filtros Server-Side */}
      <Card accent="blue" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={roleFilter ?? ''}
            onChange={(e) =>
              setRoleFilter(e.target.value ? (Number(e.target.value) as RoleId) : undefined)
            }
            options={[
              { value: '', label: 'Todos los roles' },
              { value: ROLE_IDS.ADMIN, label: 'Administrador' },
              { value: ROLE_IDS.OPERADOR, label: 'Operador' },
              { value: ROLE_IDS.CLIENTE, label: 'Cliente' },
            ]}
          />

          <Select
            value={statusFilter === undefined ? '' : statusFilter ? 'true' : 'false'}
            onChange={(e) =>
              setStatusFilter(e.target.value === '' ? undefined : e.target.value === 'true')
            }
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'true', label: 'Solo usuarios activos' },
              { value: 'false', label: 'Solo usuarios inactivos' },
            ]}
          />
        </div>
      </Card>

      {/* Tabla con manejo explícito de Loading, Error y Empty */}
      {isLoading ? (
        <Card className="py-14 flex justify-center">
          <Spinner size="lg" label="Cargando directorio de usuarios..." />
        </Card>
      ) : isError ? (
        <ErrorState
          message={error ?? 'Error al consultar el listado de usuarios.'}
          onRetry={() => void refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No se encontraron usuarios"
          description="Prueba ajustando los filtros de búsqueda, rol o estado."
        />
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0D1525] border-b border-slate-200 dark:border-[#1E2D4A] text-[11px] font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-slate-300">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D4A] text-sm">
                {users.map((u) => {
                  const isSelf = currentUser?.IDUsuario === u.IDUsuario;
                  return (
                    <tr
                      key={u.IDUsuario}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#152036]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        #{u.IDUsuario}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0A2259] dark:text-white">
                          {u.NombreCompleto}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {u.Correo} {u.Telefono ? `· ${u.Telefono}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Cambiar rol de ${u.NombreCompleto}`}
                          disabled={isSelf || isUpdatingStatus}
                          value={u.IDRol}
                          onChange={(e) =>
                            void handleChangeRole(u, Number(e.target.value) as RoleId)
                          }
                          className="bg-white dark:bg-[#0F1829] border border-slate-300 dark:border-[#1E2D4A] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0A2259] dark:text-slate-200 disabled:opacity-60"
                        >
                          <option value={ROLE_IDS.ADMIN}>Administrador</option>
                          <option value={ROLE_IDS.OPERADOR}>Operador</option>
                          <option value={ROLE_IDS.CLIENTE}>Cliente</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={u.Activo ? 'success' : 'danger'}>
                          {u.Activo ? 'Activo' : 'Desactivado'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={u.Activo ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={isSelf || isUpdatingStatus}
                          onClick={() => void handleToggleActive(u)}
                          leftIcon={<Power className="w-3.5 h-3.5" />}
                        >
                          {u.Activo ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              currentPage={numeroPagina}
              totalPages={totalPaginas}
              totalItems={totalRegistros}
              pageSize={tamanoPagina}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* Modal para crear Usuario por Admin */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        title="Registrar nuevo usuario"
        description="Crea cuentas operativas (Operador/Administrador) o de Cliente."
      >
        <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
          <Select
            label="Rol del usuario"
            value={form.watch('idRol')}
            onChange={(e) =>
              form.setValue('idRol', Number(e.target.value) as RoleId, { shouldValidate: true })
            }
            options={[
              { value: ROLE_IDS.OPERADOR, label: 'Operador (Pedidos, Devoluciones e Inventario)' },
              { value: ROLE_IDS.ADMIN, label: 'Administrador (Control Total)' },
              { value: ROLE_IDS.CLIENTE, label: 'Cliente (Tienda)' },
            ]}
          />

          <Input
            label="Nombre completo"
            placeholder="Nombre y Apellido"
            error={form.formState.errors.nombreCompleto?.message}
            {...form.register('nombreCompleto')}
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="operador@shopcart.gt"
            error={form.formState.errors.correo?.message}
            {...form.register('correo')}
          />

          <Input
            label="Teléfono (opcional)"
            placeholder="+502 5555-0000"
            error={form.formState.errors.telefono?.message}
            {...form.register('telefono')}
          />

          <Input
            label="Contraseña temporal"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={createModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
