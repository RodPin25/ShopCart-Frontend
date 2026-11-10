# ShopCart — Frontend de Comercio Electrónico de Alto Rendimiento

> **Tech Challenge 360 — Grupo Pentandra**  
> Plataforma web de comercio electrónico moderna, modular y resiliente construida con **React 19**, **TypeScript 7** y **Tailwind CSS v4**, diseñada bajo estrictos estándares de integridad transaccional, trazabilidad financiera en Quetzales (GTQ) y arquitectura por módulos funcionales (RF-01 a RF-09).

---

## 📋 Tabla de Contenidos

1. [Visión General y Propósito](#-visión-general-y-propósito)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Identidad Gráfica y Diseño](#-identidad-gráfica-y-diseño)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Mapeo de Requerimientos Funcionales (RF-01 a RF-09)](#-mapeo-de-requerimientos-funcionales-rf-01-a-rf-09)
6. [Manejo Financiero y Concurrencia](#-manejo-financiero-y-concurrencia)
7. [Variables de Entorno](#-variables-de-entorno)
8. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
9. [Scripts Disponibles](#-scripts-disponibles)
10. [Políticas de Calidad y Verificación](#-políticas-de-calidad-y-verificación)

---

## 🎯 Visión General y Propósito

ShopCart Frontend es la interfaz de usuario para una solución integral de e-commerce que conecta con un backend en **Express 5** y una base de datos relacional **Microsoft SQL Server 2019+**. La aplicación implementa los flujos completos tanto para el **Cliente** (exploración de catálogo, carrito reactivo con fusión de sesión de invitado, checkout con reserva atómica de inventario por 15 minutos y seguimiento de pedidos) como para el personal de **Backoffice** (Operadores y Administradores para gestión de inventario, kardex, catálogo multinivel con variantes y fotos, cupones, auditoría y dashboard ejecutivo).

---

## 🛠 Stack Tecnológico

* **Framework:** [React 19](https://react.dev/) (`react` & `react-dom` v19.3.1).
* **Lenguaje:** [TypeScript 7](https://www.typescriptlang.org/) en modo estricto (`"strict": true`, `"noUncheckedIndexedAccess": true`).
* **Compilador & Empaquetador:** [Vite 8](https://vitejs.dev/) con HMR instantáneo y optimización de bundle.
* **Estilos & Diseño:** [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`), `clsx` y `tailwind-merge`.
* **Enrutamiento:** [React Router 7](https://reactrouter.com/) con rutas protegidas basadas en roles (RBAC).
* **Gestión de Estado y Servidor:** [@tanstack/react-query v5](https://tanstack.com/query/latest) para cache-aside, invalidación declarativa y sincronización server-state.
* **Cliente HTTP:** [Axios](https://axios-http.com/) con interceptores transparentes para:
  - Inyección de token de acceso JWT (`Authorization: Bearer <token>`).
  - Cabecera de carrito de invitado (`x-guest-token`).
  - Mecanismo de cola asíncrona (`failedQueue`) para rotación automática de refresh token ante respuestas `401 Unauthorized`.
* **Formularios y Validación:** [React Hook Form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) (`@hookform/resolvers/zod`).
* **Visualización de Datos:** [Recharts 3](https://recharts.org/) para reportes ejecutivos interactivos (ventas por período y por categoría).
* **Iconografía:** [Lucide React](https://lucide.dev/).
* **Linter:** [Oxlint](https://oxc.rs/docs/guide/usage/linter) para verificación estática de ultra alta velocidad (< 100ms).

---

## 🎨 Identidad Gráfica y Diseño

La interfaz se alinea con la identidad corporativa de **Shop Cart**:
* **Tema Oscuro Navy (Por defecto):** Fondo `#0B111E`, contenedores `#111927` y bordes `#1E2D4A`.
* **Tema Claro:** Fondo `#F8FAFC`, superficies `#FFFFFF` y tipografía corporativa en `#0A2259`.
* **Color Primario (Acento):** Rojo carmesí `#E31E24` para botones primarios, contadores de carrito, llamadas a la acción y estados destacados.
* **Franja Tricolor Corporativa:** Implementada con la clase `.shopcart-stripe-bar` (gradiente diagonal Azul Marino, Rojo Carmesí y Blanco).
* **Iconografía e Ilustraciones Propias:** Isotipo e ilustración SVG vectorial original del Rinoceronte (`RhinoMark`, `RhinoHeroIllustration`) integrados de forma nativa sin dependencias externas.

---

## 📂 Estructura del Proyecto

El código está estructurado bajo el patrón de **Arquitectura por Módulos Funcionales (Feature-Driven Architecture)**:

```text
ShopCart-Frontend/
├── src/
│   ├── components/                 # Componentes transversales del Design System
│   │   ├── feedback/               # Alertas, ErrorState, ErrorBoundary
│   │   ├── layout/                 # ShopLayout (Público), AdminLayout (Backoffice), AuthLayout
│   │   └── ui/                     # Botones, Inputs, Select, Card, Modal, Badge, Pagination, etc.
│   ├── config/                     # Configuración centralizada de la aplicación
│   │   ├── api.ts                  # Instancia de Axios, tokenStorage e interceptores de refresco
│   │   ├── constants.ts            # Roles, endpoints, helpers GTQ, estados de órdenes
│   │   ├── env.ts                  # Validación de variables de entorno con Zod
│   │   └── schemas.ts              # Esquemas de validación Zod para todos los formularios
│   ├── context/                    # Estado global con React Context API
│   │   ├── AuthContext.tsx         # Sesión JWT, RBAC, rotación automática y fusión de carrito
│   │   └── CartContext.tsx         # Carrito reactivo, validación de stock y cálculos financieros
│   ├── features/                   # Módulos de negocio (RF-01 a RF-09)
│   │   ├── audit/                  # RF-09: Bitácora inmutable y visualizador de cambios
│   │   ├── auth/                   # RF-01: Login, registro, perfil, direcciones y usuarios
│   │   ├── cart/                   # RF-04/RF-05: Drawer lateral y vista completa de carrito
│   │   ├── catalog/                # RF-02: Catálogo público, detalle, variantes, fotos y admin
│   │   ├── checkout/               # RF-05/RF-06: Reserva de 15 min, direcciones y pago idempotente
│   │   ├── coupons/                # RF-05: Administración de cupones y auditoría de uso
│   │   ├── dashboard/              # RF-08: KPIs en tiempo real, gráficas de ventas y carritos
│   │   ├── inventory/              # RF-03: Kardex, existencias por variante y ajustes
│   │   └── orders/                 # RF-07: Seguimiento de pedidos del cliente y gestión backoffice
│   ├── hooks/                      # Custom hooks reutilizables (useDebounce, usePagination, etc.)
│   ├── routes/                     # Definición de rutas y ProtectedRoute por roles
│   ├── services/                   # Clientes de API mapeados contra los endpoints REST
│   ├── types/                      # Contratos TypeScript estrictos de todo el dominio
│   ├── App.tsx                     # Punto de entrada con proveedores globales
│   ├── index.css                   # Tailwind CSS v4 y variables CSS de diseño
│   └── main.tsx                    # Montaje de la aplicación React en el DOM
├── public/                         # Recursos estáticos
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración del compilador TypeScript
└── vite.config.ts                  # Configuración de empaquetado de Vite
```

---

## 🚀 Mapeo de Requerimientos Funcionales (RF-01 a RF-09)

| Requerimiento | Nombre | Cobertura en Frontend |
| :--- | :--- | :--- |
| **RF-01** | **Autenticación y Seguridad (RBAC)** | Registro de clientes, inicio de sesión seguro con JWT (access token 15 min + refresh token 7 días con rotación automática), gestión de perfil, CRUD de múltiples direcciones de entrega y panel de administración de usuarios (Administrador) con activación/desactivación sin borrado físico. |
| **RF-02** | **Catálogo y Productos con Variantes** | Catálogo público paginado con búsqueda por debounce y filtros en tiempo real; vista de detalle con selector de variantes (SKU, talla, color), precios dinámicos y galería de imágenes con miniaturas; panel de administración de categorías, productos maestros, variantes, atributos y bitácora de historial de precios. |
| **RF-03** | **Inventario y Kardex (PEPS)** | Consulta paginada de existencias en tiempo real (`StockFisico`, `StockReservado`, `StockDisponible`, `SumaKardex` con badge de conciliación); libro mayor de Kardex con filtros por fecha, variante y tipo de movimiento; modal de ajustes de inventario manuales (`AJUSTE_ENTRADA` / `AJUSTE_SALIDA`) con motivo obligatorio y botón de liberación forzada de reservas expiradas. |
| **RF-04** | **Carrito de Compras y Sesiones** | Carrito accesible para invitados (`x-guest-token`) y usuarios autenticados; drawer lateral deslizable y página completa `/carrito`; validación estricta de stock disponible que bloquea incrementos cuando `Cantidad >= StockDisponible`; fusión automática y transparente del carrito de invitado al iniciar sesión o registrarse (`POST /cart/merge`). |
| **RF-05** | **Promociones y Cupones** | Validación instantánea de códigos promocionales (`POST /coupons/validate`) con feedback visual en vivo; soporte para descuentos porcentuales o de monto fijo con monto mínimo de compra y tope de redenciones; panel administrativo de cupones para creación, edición, cambio de estado y visualización del historial de uso por cliente y pedido. |
| **RF-06** | **Checkout y Reservas Temporales** | Proceso de compra con reserva atómica de stock de 15 minutos (`POST /inventory/reservations/cart`); banner de cuenta regresiva en tiempo real sincronizado con el servidor; modal de advertencia ante expiración; selección de dirección guardada o registro al vuelo; prevención de doble clic y envío de cabecera `Idempotency-Key` (UUIDv4) para evitar cobros duplicados. |
| **RF-07** | **Gestión de Pedidos y Devoluciones** | Portal del cliente `/mis-pedidos` con barra visual del ciclo de vida (`PENDIENTE` → `PAGADO` → `PREPARADO` → `ENVIADO` → `ENTREGADO`); cancelación inmediata antes del despacho; solicitud de devoluciones totales o parciales por ítem con validación de límite (`Cantidad - CantidadDevuelta`); panel de Operador/Admin con control de transiciones de estado permitidas y aprobación/rechazo de devoluciones. |
| **RF-08** | **Dashboard Ejecutivo y Reportes** | Tarjetas de KPIs estratégicos (Ventas Netas, Ticket Promedio, Total Pedidos, Tasa de Devolución); gráficas interactivas con Recharts (Evolución de ventas netas por día/semana/mes y Distribución de ventas por categoría); tabla de Top 10 Productos Más Vendidos y monitor de Carritos Abandonados con cálculo de valor en riesgo en GTQ. |
| **RF-09** | **Bitácora y Auditoría del Sistema** | Vista Backoffice de solo lectura conectada a la bitácora inmutable de SQL Server; filtrado reactivo por módulo del sistema, acción (`CREAR`, `MODIFICAR`, `DESACTIVAR`, `LOGIN`, etc.), usuario y rango de fechas; visor detallado modal con comparación lado a lado de `ValorAnterior` vs `ValorNuevo` con formato JSON estructurado. |

---

## 💰 Manejo Financiero y Concurrencia

1. **Moneda Base Quetzales (GTQ) e IVA del 12%:**
   - Todo cálculo financiero se realiza a través del helper `roundCurrency(val)` para garantizar exactitud a 2 decimales sin desbordamientos de punto flotante.
   - Desglose transparente en carrito y checkout: Subtotal, Descuento por cupón (con salvaguarda que impide totales negativos), Subtotal neto sin IVA, Monto IVA (12%) e Importe Total a Pagar.
2. **Concurrencia en Checkout:**
   - La reserva temporal de 15 minutos congela el `StockDisponible` a nivel de base de datos antes del pago.
   - Cada intento de checkout genera un token único en la cabecera `Idempotency-Key`, protegiendo la transacción contra reenvíos accidentales por cortes de red o múltiples clics.
3. **Resiliencia en Tokens JWT:**
   - El cliente Axios maneja una cola `failedQueue`. Si el token expira durante una ráfaga de peticiones simultáneas, solo se dispara una solicitud de rotación a `/api/auth/refresh` y las demás solicitudes esperan el nuevo token antes de reintentar de forma transparente.

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla:

```bash
# URL base de la API del Backend (Express)
VITE_API_BASE_URL="http://localhost:3000/api"

# Nombre de la aplicación para encabezados y metadatos
VITE_APP_NAME="Shop Cart"

# Moneda oficial del sistema (ISO 4217)
VITE_CURRENCY_CODE="GTQ"

# Tasa impositiva del Impuesto al Valor Agregado (12% en Guatemala)
VITE_IVA_RATE="0.12"

# Tiempo de vida de la reserva de inventario en minutos para el checkout
VITE_RESERVATION_TTL_MINUTES="15"
```

> **Nota:** La aplicación valida estas variables al arrancar mediante un esquema tipado de Zod (`src/config/env.ts`), asignando valores por defecto seguros si no se especifican.

---

## 💻 Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js:** Versión 18.0 o superior (recomendado Node.js 20+ LTS).
* **Gestor de paquetes:** `npm` (incluido con Node.js).
* **Backend de ShopCart:** Corriendo en `http://localhost:3000` con la base de datos `ShopCartDB` configurada.

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd ShopCart-Frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible de inmediato en [http://localhost:5173](http://localhost:5173).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Genera el bundle estático ultra optimizado en la carpeta `dist/`.

---

## 📜 Scripts Disponibles

* `npm run dev`: Inicia el servidor de desarrollo Vite con Hot Module Replacement (HMR).
* `npm run build`: Ejecuta el chequeo de tipos TypeScript (`tsc -b`) y compila la aplicación para despliegue en producción.
* `npm run lint`: Ejecuta el linter **Oxlint** en todos los archivos del proyecto.
* `npm run preview`: Sirve localmente la compilación de producción generada en `dist/`.

---

## 🛡 Políticas de Calidad y Verificación

El proyecto mantiene una política estricta de **cero advertencias y cero errores**:

```bash
# 1. Verificar calidad y reglas de React / TypeScript con Oxlint:
npm run lint

# 2. Verificar chequeo estricto de tipos de TypeScript en todos los archivos:
npx tsc -b --noEmit
```

Ambos comandos se ejecutan limpiamente en el pipeline de desarrollo garantizando estabilidad y robustez del código.

---

## 👥 Roles de Usuario para Pruebas

| Rol | Correo por Defecto | Contraseña | Permisos y Áreas de Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@shopcart.gt` | `Admin123!` | Acceso irrestricto: Tienda pública, Gestión de Catálogo y Precios, Kardex e Inventario, Cupones, Gestión de Usuarios/Roles, Devoluciones, Dashboard Ejecutivo y Bitácora de Auditoría. |
| **Operador** | `operador@shopcart.gt` | `Operador123!` | Personal de bodega y despacho: Tienda pública, Ajustes de Inventario y Kardex, Ciclo de Vida de Pedidos y Aprobación/Rechazo de Devoluciones. |
| **Cliente** | `cliente1@gmail.com` | `Cliente123!` | Comprador: Catálogo público, Carrito, Aplicación de Cupones, Checkout con Reserva de 15 min, Historial de Pedidos (`/mis-pedidos`) y Solicitud de Devoluciones. |

---

*Desarrollado para el Tech Challenge 360 por Grupo Pentandra.*
