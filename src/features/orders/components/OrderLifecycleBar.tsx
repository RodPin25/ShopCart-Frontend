import {
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  Truck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ORDER_STATUS, type OrderStatus } from '../../../config/constants';
import { Badge, type BadgeVariant } from '../../../components';

const LIFECYCLE_STEPS: Array<{
  status: OrderStatus;
  label: string;
  description: string;
}> = [
  {
    status: ORDER_STATUS.PENDIENTE,
    label: 'Pendiente',
    description: 'Pedido creado',
  },
  {
    status: ORDER_STATUS.PAGADO,
    label: 'Pagado',
    description: 'Pago confirmado',
  },
  {
    status: ORDER_STATUS.EN_PREPARACION,
    label: 'Preparado',
    description: 'En empaque / bodega',
  },
  {
    status: ORDER_STATUS.ENVIADO,
    label: 'Despachado',
    description: 'En ruta de entrega',
  },
  {
    status: ORDER_STATUS.ENTREGADO,
    label: 'Entregado',
    description: 'Recibido por cliente',
  },
];

function getOrderStatusBadgeVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case ORDER_STATUS.PENDIENTE:
      return 'warning';
    case ORDER_STATUS.PAGADO:
      return 'blue';
    case ORDER_STATUS.EN_PREPARACION:
      return 'navy';
    case ORDER_STATUS.ENVIADO:
      return 'blue';
    case ORDER_STATUS.ENTREGADO:
      return 'success';
    case ORDER_STATUS.CANCELADO:
      return 'danger';
    default:
      return 'neutral';
  }
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={getOrderStatusBadgeVariant(status)}>{status}</Badge>;
}

/**
 * Barra de progreso visual del ciclo de vida del pedido (RF-07):
 * Pendiente -> Pagado -> Preparado (EN_PREPARACION) -> Despachado (ENVIADO) -> Entregado / Cancelado.
 */
export function OrderLifecycleBar({ status }: { status: OrderStatus }) {
  if (status === ORDER_STATUS.CANCELADO) {
    return (
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-700 dark:text-rose-300">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
          <Ban className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold">Pedido Cancelado</p>
          <p className="text-xs opacity-90">
            Este pedido fue cancelado antes del despacho y sus unidades fueron reintegradas al
            Kardex de inventario.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === status);

  const renderStepIcon = (stepStatus: OrderStatus) => {
    switch (stepStatus) {
      case ORDER_STATUS.PENDIENTE:
        return <Clock className="w-4 h-4" />;
      case ORDER_STATUS.PAGADO:
        return <CreditCard className="w-4 h-4" />;
      case ORDER_STATUS.EN_PREPARACION:
        return <Package className="w-4 h-4" />;
      case ORDER_STATUS.ENVIADO:
        return <Truck className="w-4 h-4" />;
      case ORDER_STATUS.ENTREGADO:
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#111927] border border-slate-200 dark:border-[#1E2D4A]">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.status}
              className={clsx(
                'flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-2.5 rounded-xl transition-colors',
                isCurrent && 'bg-[#E31E24]/10 border border-[#E31E24]/30',
              )}
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold transition-colors shrink-0',
                  isCompleted
                    ? 'bg-[#E31E24] text-white shadow-xs shadow-[#E31E24]/40'
                    : 'bg-slate-100 dark:bg-[#182640] text-slate-400',
                )}
              >
                {renderStepIcon(step.status)}
              </div>

              <div>
                <p
                  className={clsx(
                    'text-xs font-extrabold',
                    isCompleted
                      ? 'text-[#0A2259] dark:text-white'
                      : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-400">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
