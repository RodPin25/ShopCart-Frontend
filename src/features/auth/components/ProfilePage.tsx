import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Save,
  Star,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { getApiErrorMessage } from '../../../config/api';
import {
  addressSchema,
  updateProfileSchema,
  type AddressFormValues,
  type UpdateProfileFormValues,
} from '../../../config/schemas';
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
  Spinner,
} from '../../../components';
import { useAddresses } from '../hooks/useAddresses';
import type { Address } from '../types';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const {
    addresses,
    isLoading: isLoadingAddresses,
    isError: isAddressesError,
    error: addressesError,
    isEmpty: isAddressesEmpty,
    refetch: refetchAddresses,
    createAddress,
    isCreating,
    updateAddress,
    isUpdating,
    deleteAddress,
    isDeleting,
    setPrincipalAddress,
    isSettingPrincipal,
  } = useAddresses();

  const addressModal = useDisclosure<Address>();
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nombreCompleto: user?.NombreCompleto ?? '',
      telefono: user?.Telefono ?? '',
      password: '',
    },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      direccionLinea: '',
      municipio: '',
      departamento: '',
      codigoPostal: '',
      referencia: '',
      esPrincipal: false,
    },
  });

  const handleOpenNewAddress = () => {
    setAddressFeedback(null);
    addressForm.reset({
      direccionLinea: '',
      municipio: '',
      departamento: '',
      codigoPostal: '',
      referencia: '',
      esPrincipal: addresses.length === 0,
    });
    addressModal.open();
  };

  const handleOpenEditAddress = (address: Address) => {
    setAddressFeedback(null);
    addressForm.reset({
      direccionLinea: address.DireccionLinea,
      municipio: address.Municipio,
      departamento: address.Departamento,
      codigoPostal: address.CodigoPostal ?? '',
      referencia: address.Referencia ?? '',
      esPrincipal: address.EsPrincipal,
    });
    addressModal.open(address);
  };

  const onSubmitProfile = async (values: UpdateProfileFormValues) => {
    setProfileFeedback(null);
    try {
      await updateProfile({
        nombreCompleto: values.nombreCompleto.trim(),
        telefono: values.telefono?.trim() || undefined,
        password: values.password ? values.password : undefined,
      });
      profileForm.setValue('password', '');
      setProfileFeedback({
        type: 'success',
        message: 'Tu perfil se actualizó correctamente.',
      });
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const onSubmitAddress = async (values: AddressFormValues) => {
    setAddressFeedback(null);
    const payload = {
      direccionLinea: values.direccionLinea.trim(),
      municipio: values.municipio.trim(),
      departamento: values.departamento.trim(),
      codigoPostal: values.codigoPostal?.trim() || undefined,
      referencia: values.referencia?.trim() || undefined,
      esPrincipal: values.esPrincipal,
    };

    try {
      if (addressModal.data) {
        await updateAddress({
          idDireccion: addressModal.data.IDDireccion,
          payload,
        });
        setAddressFeedback({
          type: 'success',
          message: 'Dirección actualizada con éxito.',
        });
      } else {
        await createAddress(payload);
        setAddressFeedback({
          type: 'success',
          message: 'Nueva dirección agregada a tu libreta.',
        });
      }
      addressModal.close();
    } catch (err) {
      setAddressFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleDeleteAddress = async (idDireccion: number) => {
    setAddressFeedback(null);
    try {
      await deleteAddress(idDireccion);
      setAddressFeedback({
        type: 'success',
        message: 'Dirección eliminada correctamente.',
      });
    } catch (err) {
      setAddressFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleSetPrincipal = async (idDireccion: number) => {
    setAddressFeedback(null);
    try {
      await setPrincipalAddress(idDireccion);
      setAddressFeedback({
        type: 'success',
        message: 'Dirección principal de entrega actualizada.',
      });
    } catch (err) {
      setAddressFeedback({
        type: 'error',
        message: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1E2D4A] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white">
            Mi Perfil y Direcciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra tus datos personales y tus direcciones de entrega en toda Guatemala
          </p>
        </div>
        {user && <Badge variant="red">{user.NombreRol}</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Datos Personales */}
        <div className="lg:col-span-5">
          <Card accent="blue" className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A2259]/10 dark:bg-blue-950 text-[#0A2259] dark:text-blue-300 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
                  Información Personal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.Correo}</p>
              </div>
            </div>

            {profileFeedback && (
              <Alert
                variant={profileFeedback.type}
                onClose={() => setProfileFeedback(null)}
              >
                {profileFeedback.message}
              </Alert>
            )}

            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              <Input
                label="Nombre completo"
                error={profileForm.formState.errors.nombreCompleto?.message}
                {...profileForm.register('nombreCompleto')}
              />

              <Input
                label="Teléfono"
                placeholder="+502 5555-0000"
                error={profileForm.formState.errors.telefono?.message}
                {...profileForm.register('telefono')}
              />

              <Input
                label="Nueva contraseña (dejar en blanco para mantener actual)"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                error={profileForm.formState.errors.password?.message}
                {...profileForm.register('password')}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={profileForm.formState.isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Guardar cambios
              </Button>
            </form>
          </Card>
        </div>

        {/* Columna Derecha: Libreta de Direcciones */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
                Mis Direcciones de Entrega
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona tu dirección principal para agilizar el Checkout
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewAddress}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nueva dirección
            </Button>
          </div>

          {addressFeedback && (
            <Alert variant={addressFeedback.type} onClose={() => setAddressFeedback(null)}>
              {addressFeedback.message}
            </Alert>
          )}

          {isLoadingAddresses ? (
            <Card className="py-12 flex justify-center">
              <Spinner label="Cargando tus direcciones..." />
            </Card>
          ) : isAddressesError ? (
            <ErrorState
              message={addressesError ?? 'No fue posible obtener tus direcciones.'}
              onRetry={() => void refetchAddresses()}
            />
          ) : isAddressesEmpty ? (
            <EmptyState
              icon={<MapPin className="w-7 h-7" />}
              title="Aún no tienes direcciones registradas"
              description="Agrega tu primera dirección de entrega para poder confirmar tus compras."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenNewAddress}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Agregar dirección
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {addresses.map((address) => (
                <Card
                  key={address.IDDireccion}
                  accent={address.EsPrincipal ? 'red' : 'none'}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0A2259] dark:text-white">
                        {address.Municipio}, {address.Departamento}
                      </span>
                      {address.EsPrincipal && (
                        <Badge variant="red">
                          <CheckCircle2 className="w-3 h-3" /> Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {address.DireccionLinea}
                    </p>
                    {(address.Referencia || address.CodigoPostal) && (
                      <p className="text-xs text-slate-400">
                        {address.Referencia ? `Ref: ${address.Referencia}` : ''}{' '}
                        {address.CodigoPostal ? `· CP ${address.CodigoPostal}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!address.EsPrincipal && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isSettingPrincipal}
                        onClick={() => void handleSetPrincipal(address.IDDireccion)}
                        leftIcon={<Star className="w-3.5 h-3.5" />}
                      >
                        Predeterminar
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditAddress(address)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Editar
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => void handleDeleteAddress(address.IDDireccion)}
                      aria-label="Eliminar dirección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Dirección */}
      <Modal
        isOpen={addressModal.isOpen}
        onClose={addressModal.close}
        title={addressModal.data ? 'Editar dirección de entrega' : 'Nueva dirección de entrega'}
        description="Completa los datos exactos para la entrega de tus pedidos."
      >
        <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
          <Input
            label="Dirección exacta (calle, avenida, zona, número de casa/apto)"
            placeholder="Ej. 6a Avenida 12-34 Zona 10, Edificio Plaza"
            error={addressForm.formState.errors.direccionLinea?.message}
            {...addressForm.register('direccionLinea')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Departamento"
              placeholder="Ej. Guatemala"
              error={addressForm.formState.errors.departamento?.message}
              {...addressForm.register('departamento')}
            />
            <Input
              label="Municipio"
              placeholder="Ej. Guatemala"
              error={addressForm.formState.errors.municipio?.message}
              {...addressForm.register('municipio')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código Postal (opcional)"
              placeholder="01010"
              error={addressForm.formState.errors.codigoPostal?.message}
              {...addressForm.register('codigoPostal')}
            />
            <Input
              label="Referencia (opcional)"
              placeholder="Portón gris frente a parque"
              error={addressForm.formState.errors.referencia?.message}
              {...addressForm.register('referencia')}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#E31E24] rounded"
              {...addressForm.register('esPrincipal')}
            />
            <span className="text-sm font-medium text-[#0A2259] dark:text-slate-200">
              Establecer como mi dirección principal de entrega
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={addressModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating || isUpdating}
            >
              {addressModal.data ? 'Guardar cambios' : 'Registrar dirección'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
