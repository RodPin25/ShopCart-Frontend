import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, Phone, User as UserIcon, UserPlus } from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '../../../config/schemas';
import { useAuth, useCart } from '../../../context';
import { Alert, Button, Input } from '../../../components';

export function RegisterPage() {
  const { register: registerAccount, error: authError, clearError } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombreCompleto: '',
      correo: '',
      telefono: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    clearError();
    try {
      await registerAccount({
        nombreCompleto: values.nombreCompleto.trim(),
        correo: values.correo.trim(),
        telefono: values.telefono?.trim() || undefined,
        password: values.password,
      });
      await fetchCart();
      navigate('/', { replace: true });
    } catch {
      // El error queda reflejado en `authError`
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">Crear cuenta</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Regístrate para comprar y dar seguimiento a tus pedidos
        </p>
      </div>

      {authError && (
        <Alert variant="error" title="No se pudo completar el registro" onClose={clearError}>
          {authError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Nombre completo"
          type="text"
          autoComplete="name"
          placeholder="Juan Pérez"
          leftIcon={<UserIcon className="w-4 h-4" />}
          error={errors.nombreCompleto?.message}
          {...register('nombreCompleto')}
        />

        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="juan@ejemplo.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.correo?.message}
          {...register('correo')}
        />

        <Input
          label="Teléfono (opcional)"
          type="tel"
          autoComplete="tel"
          placeholder="+502 5555-0000"
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.telefono?.message}
          {...register('telefono')}
        />

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1 text-slate-400 hover:text-[#0A2259] dark:hover:text-white cursor-pointer"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('password')}
        />

        <Input
          label="Confirmar contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Crear mi cuenta
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-slate-200 dark:border-[#1E2D4A] text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" className="font-bold text-[#E31E24] hover:underline ml-1">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
