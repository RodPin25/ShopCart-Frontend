import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  TicketPercent,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getApiErrorMessage } from '../../../config/api';
import { formatGTQ } from '../../../config/constants';
import {
  addressSchema,
  applyCouponSchema,
  type AddressFormValues,
  type ApplyCouponFormValues,
} from '../../../config/schemas';
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
  Select,
  Spinner,
} from '../../../components';
import { useAddresses } from '../../auth/hooks/useAddresses';
import { useCheckout } from '../hooks/useCheckout';
import { ReservationTimerBanner } from './ReservationTimerBanner';

export function CheckoutPage() {
  const navigate = useNavigate();
  const {
    addresses,
    principalAddress,
    isLoading: isLoadingAddresses,
    createAddress,
    isCreating: isCreatingAddress,
  } = useAddresses();

  const {
    items,
    totalUnits,
    subtotal,
    discountAmount,
    subtotalSinIVA,
    taxAmount,
    total,
    appliedCouponCode,
    idempotencyKey,
    countdown,
    isReserving,
    reservationError,
    retryReservation,
    isExpiredModalOpen,
    isProcessingPayment,
    checkoutError,
    clearCheckoutError,
    completedOrder,
    couponFeedback,
    clearCouponFeedback,
    applyCouponInCheckout,
    removeCouponInCheckout,
    submitIdempotentPayment,
  } = useCheckout();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('TARJETA_CREDITO');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [addressError, setAddressError] = useState<string | null>(null);

  const newAddressModal = useDisclosure();

  const effectiveAddressId =
    selectedAddressId ?? principalAddress?.IDDireccion ?? addresses[0]?.IDDireccion ?? null;

  const couponForm = useForm<ApplyCouponFormValues>({
    resolver: zodResolver(applyCouponSchema),
    defaultValues: {
      codigo: appliedCouponCode ?? '',
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
      esPrincipal: true,
    },
  });

  const handleCreateQuickAddress = async (values: AddressFormValues) => {
    setAddressError(null);
    try {
      const created = await createAddress({
        direccionLinea: values.direccionLinea.trim(),
        municipio: values.municipio.trim(),
        departamento: values.departamento.trim(),
        codigoPostal: values.codigoPostal?.trim() || undefined,
        referencia: values.referencia?.trim() || undefined,
        esPrincipal: values.esPrincipal,
      });
      setSelectedAddressId(created.IDDireccion);
      newAddressModal.close();
      addressForm.reset();
    } catch (err) {
      setAddressError(getApiErrorMessage(err));
    }
  };

  const handleConfirmPayment = async () => {
    if (!effectiveAddressId) {
      setAddressError('Selecciona o registra una dirección de entrega antes de pagar.');
      return;
    }
    setAddressError(null);
    await submitIdempotentPayment({
      idDireccion: effectiveAddressId,
      metodoPago: paymentMethod,
      transaccionId: transactionReference,
    });
  };

  // Pantalla de Confirmación de Pedido Exitoso (RF-06)
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card accent="emerald" className="p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <Badge variant="success">PAGO CONFIRMADO — PEDIDO #{completedOrder.IDPedido}</Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white">
              ¡Gracias por tu compra en Shop Cart!
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Hemos congelado tus precios y descuentos. Tu pedido ya está en manos de nuestro equipo
              operativo.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] text-sm space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Número de pedido:</span>
              <span className="font-mono font-bold">#{completedOrder.IDPedido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado inicial:</span>
              <Badge variant="navy">{completedOrder.EstadoPedido}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Llave de idempotencia:</span>
              <span className="font-mono text-xs text-slate-400">{idempotencyKey}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-[#1E2D4A] text-base font-extrabold">
              <span>Total pagado (IVA 12% incl.):</span>
              <span className="text-[#E31E24]">{formatGTQ(completedOrder.Total)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to={`/mis-pedidos/${completedOrder.IDPedido}`}>
              <Button variant="primary" size="lg">
                Dar seguimiento a mi pedido
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="lg">
                Volver a la tienda
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="No tienes productos para procesar en el Checkout"
          description="Agrega productos a tu carrito antes de iniciar el proceso de reserva y pago."
          action={
            <Link to="/">
              <Button variant="primary">Ir al catálogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          to="/carrito"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:text-[#E31E24] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al carrito
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2259] dark:text-white">
          Confirmación y Pago Seguro
        </h1>
      </div>

      {/* Temporizador de Reserva de 15 Minutos (RF-06) */}
      <ReservationTimerBanner
        formattedTime={countdown.formattedTime}
        progressPercentage={countdown.progressPercentage}
        remainingSeconds={countdown.remainingSeconds}
        isReserving={isReserving}
      />

      {reservationError && (
        <ErrorState
          title="No pudimos reservar la existencia de uno o más productos"
          message={reservationError}
          onRetry={() => void retryReservation()}
        />
      )}

      {checkoutError && (
        <Alert variant="error" title="No se pudo procesar el pago" onClose={clearCheckoutError}>
          {checkoutError}
        </Alert>
      )}

      {addressError && (
        <Alert variant="warning" onClose={() => setAddressError(null)}>
          {addressError}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: 1) Dirección de Entrega y 2) Método de Pago */}
        <div className="lg:col-span-7 space-y-6">
          {/* Paso 1: Dirección de Entrega (RF-06) */}
          <Card accent="blue" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0A2259] text-white font-extrabold text-xs flex items-center justify-center">
                  1
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white">
                    Dirección de Entrega
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Elige dónde recibirás tu pedido o registra una nueva dirección
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => newAddressModal.open()}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Nueva dirección
              </Button>
            </div>

            {isLoadingAddresses ? (
              <div className="py-8 flex justify-center">
                <Spinner label="Cargando tus direcciones..." />
              </div>
            ) : addresses.length === 0 ? (
              <EmptyState
                icon={<MapPin className="w-6 h-6" />}
                title="No tienes direcciones guardadas"
                description="Registra una dirección de entrega para habilitar el pago."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => newAddressModal.open()}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Registrar dirección ahora
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {addresses.map((addr) => {
                  const isSelected = effectiveAddressId === addr.IDDireccion;
                  return (
                    <label
                      key={addr.IDDireccion}
                      className={clsx(
                        'flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
                        isSelected
                          ? 'border-[#E31E24] bg-[#E31E24]/5 dark:bg-[#E31E24]/10'
                          : 'border-slate-200 dark:border-[#1E2D4A] hover:border-[#0A2259]',
                      )}
                    >
                      <input
                        type="radio"
                        name="checkoutAddress"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.IDDireccion)}
                        className="mt-1 w-4 h-4 accent-[#E31E24]"
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2 font-extrabold text-[#0A2259] dark:text-white">
                          <span>
                            {addr.Municipio}, {addr.Departamento}
                          </span>
                          {addr.EsPrincipal && <Badge variant="red">Principal</Badge>}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          {addr.DireccionLinea}
                        </p>
                        {addr.Referencia && (
                          <p className="text-xs text-slate-400 mt-0.5">Ref: {addr.Referencia}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Paso 2: Método de Pago e Idempotencia (RF-06) */}
          <Card accent="navy" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0A2259] text-white font-extrabold text-xs flex items-center justify-center">
                2
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0A2259] dark:text-white flex items-center gap-2">
                  <span>Método de Pago</span>
                  <CreditCard className="w-4 h-4 text-[#E31E24]" />
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Operación protegida contra cobros duplicados mediante llave de idempotencia
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Medio de pago"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito (Visa / Mastercard)' },
                  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
                  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria ACH' },
                ]}
              />

              <Input
                label="Referencia / Autorización (opcional)"
                placeholder="Autogenerada si se omite"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D1525] border border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Idempotency-Key activa:</span>
              <code className="font-mono font-bold text-[#0A2259] dark:text-slate-300">
                {idempotencyKey}
              </code>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Cupón (RF-05), Resumen de Precios Congelados y Botón Pagar Bloqueable */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cupón en Checkout (RF-05) */}
          <Card accent="blue" className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0A2259] dark:text-white flex items-center gap-2">
              <TicketPercent className="w-4 h-4 text-[#E31E24]" />
              <span>Cupón Promocional (RF-05)</span>
            </h2>

            {couponFeedback && (
              <Alert variant={couponFeedback.type} onClose={clearCouponFeedback}>
                {couponFeedback.message}
              </Alert>
            )}

            {appliedCouponCode ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-300 block">
                    Cupón {appliedCouponCode} aplicado
                  </strong>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Descuento: - {formatGTQ(discountAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void removeCouponInCheckout()}
                  className="p-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={couponForm.handleSubmit((vals) => applyCouponInCheckout(vals.codigo))}
                className="flex items-start gap-2"
              >
                <div className="flex-1">
                  <Input
                    placeholder="Ingresa tu código de cupón"
                    error={couponForm.formState.errors.codigo?.message}
                    {...couponForm.register('codigo')}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={couponForm.formState.isSubmitting}
                >
                  Validar
                </Button>
              </form>
            )}
          </Card>

          {/* Resumen de Artículos y Pago Idempotente */}
          <Card accent="red" className="space-y-5">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Resumen de Compra ({totalUnits} uds.)
            </h2>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 dark:divide-[#1E2D4A] pr-1">
              {items.map((item) => (
                <div key={item.IDVariante} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-[#0A2259] dark:text-white truncate">
                      {item.Cantidad}x {item.NombreProducto}
                    </p>
                    <p className="text-slate-400 truncate">
                      {item.NombreVariante} ({item.SKU})
                    </p>
                  </div>
                  <span className="font-extrabold text-[#0A2259] dark:text-white shrink-0">
                    {formatGTQ(item.SubtotalLinea)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A] text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold">{formatGTQ(subtotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Descuento por cupón</span>
                <span className="font-bold">- {formatGTQ(discountAmount)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal sin IVA</span>
                <span>{formatGTQ(subtotalSinIVA)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA incluido (12%)</span>
                <span>{formatGTQ(taxAmount)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
                <span className="text-base font-extrabold text-[#0A2259] dark:text-white">
                  Total a pagar
                </span>
                <span className="text-2xl font-extrabold text-[#E31E24]">
                  {formatGTQ(total)}
                </span>
              </div>
            </div>

            {/* Botón Pagar con bloqueo inmediato para impedir doble envío (RF-06) */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={
                isProcessingPayment ||
                isReserving ||
                Boolean(reservationError) ||
                !effectiveAddressId
              }
              isLoading={isProcessingPayment}
              onClick={() => void handleConfirmPayment()}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              {isProcessingPayment
                ? 'Procesando pago seguro...'
                : `Pagar ahora ${formatGTQ(total)}`}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-[#E31E24] shrink-0" />
              <span>Transacción atómica protegida con llave de idempotencia única</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal para registrar nueva dirección sin abandonar el Checkout */}
      <Modal
        isOpen={newAddressModal.isOpen}
        onClose={newAddressModal.close}
        title="Registrar dirección de entrega"
      >
        <form onSubmit={addressForm.handleSubmit(handleCreateQuickAddress)} className="space-y-4">
          <Input
            label="Dirección exacta"
            placeholder="Calle, avenida, zona, número de casa"
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
              placeholder="Portón negro"
              error={addressForm.formState.errors.referencia?.message}
              {...addressForm.register('referencia')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E2D4A]">
            <Button variant="ghost" onClick={newAddressModal.close}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingAddress}>
              Guardar y usar dirección
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal obligatorio de Expiración de Reserva de 15 minutos (RF-06) */}
      <Modal
        isOpen={isExpiredModalOpen}
        onClose={() => navigate('/carrito')}
        title="Tu reserva temporal de 15 minutos ha expirado"
        closeOnBackdrop={false}
      >
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E31E24]/15 text-[#E31E24] flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            El tiempo de reserva de 15 minutos concluyó y las unidades apartadas fueron liberadas
            para otros clientes. Te devolveremos a tu carrito para verificar la disponibilidad
            actual.
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/carrito', { replace: true })}
          >
            Volver al carrito de compras
          </Button>
        </div>
      </Modal>
    </div>
  );
}
