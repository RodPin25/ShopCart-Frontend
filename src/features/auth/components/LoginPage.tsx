import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { ROLE_IDS } from '../../../config/constants';
import { loginSchema, type LoginFormValues } from '../../../config/schemas';
import { useAuth, useCart } from '../../../context';
import { Alert, Button, Input } from '../../../components';

export function LoginPage() {
  const { login, error: authError, clearError } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    clearError();
    try {
      const authenticatedUser = await login(values);
      // Refrescar carrito tras la fusión automática del carrito de invitado (RF-04)
      await fetchCart();

      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      if (fromPath) {
        navigate(fromPath, { replace: true });
        return;
      }

      const isInternalStaff =
        authenticatedUser.IDRol === ROLE_IDS.ADMIN ||
        authenticatedUser.IDRol === ROLE_IDS.OPERADOR;

      navigate(isInternalStaff ? '/admin/dashboard' : '/', { replace: true });
    } catch {
      // El mensaje de error ya queda capturado en `authError` del AuthContext
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-extrabold text-[#0A2259] dark:text-white">Iniciar sesión</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      {authError && (
        <Alert variant="error" title="Error de autenticación" onClose={clearError}>
          {authError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="ejemplo@correo.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.correo?.message}
          {...register('correo')}
        />

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
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

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Entrar a mi cuenta
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-slate-200 dark:border-[#1E2D4A] text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        ¿Aún no tienes cuenta en Shop Cart?{' '}
        <Link
          to="/registro"
          className="font-bold text-[#E31E24] hover:underline ml-1"
        >
          Regístrate aquí
        </Link>
      </div>
    </div>
  );
}
