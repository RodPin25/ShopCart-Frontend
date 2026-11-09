import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, CartProvider } from './context';
import {
  Button,
  Card,
  ErrorBoundary,
  RhinoHeroIllustration,
  ShopLayout,
} from './components';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Vista previa del Hero y tarjetas de valor de "Shop Cart" (fiel al PDF de diseño)
 * mientras se conectan las rutas completas en `src/routes/AppRoutes.tsx`.
 */
function HomePreview() {
  return (
    <div>
      {/* Hero Section idéntica a las páginas 1, 2 y 3 del PDF */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0B111E] transition-colors">
        {/* Diagonal decorativa azul/roja de fondo en el extremo derecho */}
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[48%] bg-sky-50/70 dark:bg-[#0E1E40]/65 -skew-x-12 translate-x-16 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-7 bg-[#E31E24] -skew-x-12 translate-x-3 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Columna Izquierda: Tipografía de alto impacto y CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.08] text-[#0A2259] dark:text-white">
              Todo lo que buscas
              <span className="block text-[#E31E24]">con fuerza de</span>
              <span className="block text-[#E31E24]">rinoceronte</span>
            </h1>

            <p className="text-base sm:text-lg text-[#0A2259]/80 dark:text-slate-300 max-w-md leading-relaxed">
              Tecnología, hogar, moda y mucho más en un solo lugar. Compra desde tu casa.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button variant="primary" size="lg">
                Ver ofertas
              </Button>
              <Button variant="secondary" size="lg">
                Explorar todo
              </Button>
            </div>
          </div>

          {/* Columna Derecha: Ilustración del Rinoceronte con rampa roja y carrito */}
          <div className="lg:col-span-6">
            <RhinoHeroIllustration />
          </div>
        </div>
      </section>

      {/* Franja divisoria diagonal tricolor (Rojo / Blanco / Navy) del PDF */}
      <div className="shopcart-stripe-bar" />

      {/* Tres tarjetas de propuesta de valor con borde superior de color (fiel al PDF) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card accent="blue" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Envíos a todo el país
            </h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Recibe tu pedido en la puerta de tu casa.
            </p>
          </Card>

          <Card accent="red" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">Pago seguro</h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Compra con confianza, siempre.
            </p>
          </Card>

          <Card accent="navy" className="p-6">
            <h2 className="text-lg font-extrabold text-[#0A2259] dark:text-white">
              Devoluciones fáciles
            </h2>
            <p className="text-sm text-[#0A2259]/75 dark:text-slate-400 mt-1">
              Si no te gusta, lo resolvemos.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <ShopLayout>
                <HomePreview />
              </ShopLayout>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
