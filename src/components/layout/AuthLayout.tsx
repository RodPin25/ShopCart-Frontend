import type { ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks';
import { BrandLogo } from '../ui/BrandLogo';
import { Card } from '../ui/Card';

export function AuthLayout({ children }: { children?: ReactNode }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B111E] text-[#0A2259] dark:text-slate-100 transition-colors">
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0A2259] dark:text-slate-300 hover:text-[#E31E24] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-full border border-slate-200 dark:border-[#1E2D4A] hover:bg-slate-100 dark:hover:bg-[#162238] cursor-pointer"
          aria-label="Alternar tema visual"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to="/">
              <BrandLogo size="lg" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Todo lo que buscas con fuerza de rinoceronte
            </p>
          </div>

          <Card accent="red" className="p-6 sm:p-8 shadow-xl">
            {children ?? <Outlet />}
          </Card>
        </div>
      </div>

      <div className="shopcart-stripe-bar" />
    </div>
  );
}
