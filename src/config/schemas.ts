import { z } from 'zod';
import { AUDIT_ACTIONS, AUDIT_MODULES, ORDER_STATUS, ROLE_IDS } from './constants';

/**
 * Esquemas Zod espejo de las validaciones OpenAPI del backend (`localhost:3000/api/docs.json`).
 * Garantizan validación tipada en formularios con React Hook Form + @hookform/resolvers/zod.
 */

// ============================================================================
// RF-01: Autenticación, Registro, Perfil, Direcciones y Usuarios
// ============================================================================

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nombreCompleto: z
      .string()
      .trim()
      .min(3, 'El nombre completo debe tener al menos 3 caracteres')
      .max(150, 'El nombre no puede exceder 150 caracteres'),
    correo: z
      .string()
      .trim()
      .min(1, 'El correo electrónico es obligatorio')
      .email('Ingresa un correo electrónico válido'),
    telefono: z
      .string()
      .trim()
      .max(25, 'El teléfono no puede exceder 25 caracteres')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const updateProfileSchema = z.object({
  nombreCompleto: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  telefono: z
    .string()
    .trim()
    .max(25, 'El teléfono no puede exceder 25 caracteres')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const addressSchema = z.object({
  direccionLinea: z
    .string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  municipio: z
    .string()
    .trim()
    .min(2, 'El municipio es obligatorio')
    .max(100, 'El municipio no puede exceder 100 caracteres'),
  departamento: z
    .string()
    .trim()
    .min(2, 'El departamento es obligatorio')
    .max(100, 'El departamento no puede exceder 100 caracteres'),
  codigoPostal: z
    .string()
    .trim()
    .max(20, 'El código postal no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  referencia: z
    .string()
    .trim()
    .max(255, 'La referencia no puede exceder 255 caracteres')
    .optional()
    .or(z.literal('')),
  esPrincipal: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export const adminCreateUserSchema = z.object({
  idRol: z.union([
    z.literal(ROLE_IDS.ADMIN),
    z.literal(ROLE_IDS.OPERADOR),
    z.literal(ROLE_IDS.CLIENTE),
  ]),
  nombreCompleto: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  correo: z
    .string()
    .trim()
    .email('Ingresa un correo electrónico válido'),
  telefono: z.string().trim().max(25).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserSchema>;

// ============================================================================
// RF-02: Catálogo de Productos, Categorías y Variantes
// ============================================================================

export const categorySchema = z.object({
  nombreCategoria: z
    .string()
    .trim()
    .min(2, 'El nombre de la categoría debe tener al menos 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: z
    .string()
    .trim()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  activo: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  idCategoria: z.number().int().positive('Selecciona una categoría válida'),
  nombreProducto: z
    .string()
    .trim()
    .min(3, 'El nombre del producto debe tener al menos 3 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  descripcion: z
    .string()
    .trim()
    .max(1000, 'Máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3, 'El SKU debe tener al menos 3 caracteres')
    .max(50, 'El SKU no puede exceder 50 caracteres')
    .regex(/^[A-Za-z0-9-_]+$/, 'El SKU solo puede contener letras, números, guiones y guiones bajos'),
  nombreVariante: z
    .string()
    .trim()
    .min(2, 'El nombre de la variante es obligatorio')
    .max(150, 'Máximo 150 caracteres'),
  precio: z
    .number()
    .positive('El precio en GTQ debe ser mayor a Q 0.00'),
  stockInicial: z
    .number()
    .int('El stock inicial debe ser un número entero')
    .min(0, 'El stock inicial no puede ser negativo'),
  activo: z.boolean(),
});

export type VariantFormValues = z.infer<typeof variantSchema>;

export const variantAttributeSchema = z.object({
  clave: z
    .string()
    .trim()
    .min(1, 'El nombre del atributo (ej. Talla, Color) es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  valor: z
    .string()
    .trim()
    .min(1, 'El valor del atributo es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
});

export type VariantAttributeFormValues = z.infer<typeof variantAttributeSchema>;

// ============================================================================
// RF-03: Inventario y Ajustes de Kardex
// ============================================================================

export const inventoryAdjustmentSchema = z.object({
  idVariante: z.number().int().positive('Debes seleccionar una variante'),
  tipoMovimiento: z.enum(['AJUSTE_ENTRADA', 'AJUSTE_SALIDA']),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad a ajustar debe ser mayor a 0'),
  motivo: z
    .string()
    .trim()
    .min(5, 'El motivo del ajuste es obligatorio (mínimo 5 caracteres)')
    .max(300, 'El motivo no puede exceder 300 caracteres'),
});

export type InventoryAdjustmentFormValues = z.infer<typeof inventoryAdjustmentSchema>;

// ============================================================================
// RF-05: Cupones y Promociones
// ============================================================================

export const applyCouponSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, 'Ingresa un código de cupón válido')
    .max(50, 'Código demasiado largo')
    .transform((val) => val.toUpperCase()),
});

export type ApplyCouponFormValues = z.infer<typeof applyCouponSchema>;

export const couponSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(3, 'El código debe tener al menos 3 caracteres')
      .max(40, 'Máximo 40 caracteres')
      .regex(/^[A-Za-z0-9-_]+$/, 'Solo letras, números y guiones sin espacios')
      .transform((val) => val.toUpperCase()),
    tipoDescuento: z.enum(['PORCENTAJE', 'MONTO_FIJO']),
    valorDescuento: z
      .number()
      .positive('El valor del descuento debe ser mayor a 0'),
    montoMinimoCompra: z
      .number()
      .min(0, 'El monto mínimo no puede ser negativo'),
    idCategoria: z.number().int().nonnegative().nullable().optional(),
    fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
    fechaFin: z.string().min(1, 'La fecha de fin debe tener valor'),
    limiteUsosTotal: z
      .number()
      .int()
      .positive('El límite total de usos debe ser al menos 1'),
    limiteUsosPorCliente: z
      .number()
      .int()
      .positive('El límite por cliente debe ser al menos 1'),
    activo: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.tipoDescuento === 'PORCENTAJE') {
        return data.valorDescuento <= 100;
      }
      return true;
    },
    {
      message: 'Un descuento por porcentaje no puede superar el 100%',
      path: ['valorDescuento'],
    }
  )
  .refine(
    (data) => new Date(data.fechaFin) > new Date(data.fechaInicio),
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['fechaFin'],
    }
  );

export type CouponFormValues = z.infer<typeof couponSchema>;

// ============================================================================
// RF-06 & RF-07: Checkout, Pedidos y Devoluciones
// ============================================================================

export const checkoutSchema = z.object({
  idDireccion: z.number().int().positive('Debes seleccionar una dirección de entrega'),
  metodoPago: z.enum(['TARJETA', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA_BANCARIA']),
  codigoCupon: z.string().trim().optional(),
  transaccionId: z.string().trim().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const changeOrderStatusSchema = z.object({
  estadoNuevo: z.enum([
    ORDER_STATUS.PAGADO,
    ORDER_STATUS.EN_PREPARACION,
    ORDER_STATUS.ENVIADO,
    ORDER_STATUS.ENTREGADO,
    ORDER_STATUS.CANCELADO,
  ]),
  motivo: z
    .string()
    .trim()
    .max(300, 'El motivo no puede exceder 300 caracteres')
    .optional(),
});

export type ChangeOrderStatusFormValues = z.infer<typeof changeOrderStatusSchema>;

export const requestReturnSchema = z.object({
  idPedido: z.number().int().positive(),
  motivo: z
    .string()
    .trim()
    .min(5, 'Describe el motivo de la devolución (mínimo 5 caracteres)')
    .max(300, 'Máximo 300 caracteres'),
  items: z
    .array(
      z.object({
        idVariante: z.number().int().positive(),
        cantidad: z.number().int().positive('La cantidad a devolver debe ser al menos 1'),
        maxCantidadPermitida: z.number().int().positive().optional(),
      })
    )
    .min(1, 'Debes seleccionar al menos un artículo para devolver'),
});

export type RequestReturnFormValues = z.infer<typeof requestReturnSchema>;

export const resolveReturnSchema = z.object({
  nuevoEstado: z.enum(['APROBADA', 'RECHAZADA']),
  observacion: z
    .string()
    .trim()
    .min(3, 'Ingresa una observación sobre la resolución')
    .max(300, 'Máximo 300 caracteres'),
});

export type ResolveReturnFormValues = z.infer<typeof resolveReturnSchema>;

// ============================================================================
// RF-09: Filtros de Bitácora
// ============================================================================

export const auditFilterSchema = z.object({
  modulo: z.enum([...AUDIT_MODULES, '']).optional(),
  accion: z.enum([...AUDIT_ACTIONS, '']).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});
