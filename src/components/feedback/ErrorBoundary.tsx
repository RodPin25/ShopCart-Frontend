import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocurrió un error inesperado en la interfaz.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ShopCart ErrorBoundary]:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#0B111E]">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-[#1E2D4A] border-t-4 border-t-[#E31E24] bg-white dark:bg-[#111927] p-8 text-center shadow-xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E31E24]/15 text-[#E31E24] flex items-center justify-center">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#0A2259] dark:text-white">
              Algo salió mal en la aplicación
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {this.state.errorMessage}
            </p>
            <Button
              variant="primary"
              onClick={this.handleReload}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
