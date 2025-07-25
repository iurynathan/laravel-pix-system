import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Set document title
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      data-testid="auth-layout"
      className="min-h-screen bg-gray-50 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div
        data-testid="auth-container"
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        {/* Brand Section */}
        <div className="text-center mb-8">
          <div
            data-testid="brand-logo"
            className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4"
          >
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">PIX System</h1>
          <p className="text-sm text-gray-600 mb-6">
            Sistema de Pagamentos Instantâneos
          </p>

          {title && (
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {title}
            </h2>
          )}

          {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
        </div>

        {/* Main Content */}
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="max-w-md w-full space-y-8">{children}</div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 bg-white/50 rounded-lg p-3 backdrop-blur-sm">
            <p className="font-medium text-green-700 mb-1">
              🔒 Suas informações estão seguras
            </p>
            <p className="text-xs">
              Utilizamos criptografia de ponta para proteger seus dados
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <div className="text-xs text-gray-500">
            <p>© 2024 PIX System.</p>
            <p>Todos os direitos reservados</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
