import { type ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/organisms/Header';
import { Sidebar } from '@/components/organisms/Sidebar';
import { cn } from '@/utils/helpers';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface FloatingActionButton {
  icon: ReactNode;
  onClick: () => void;
  label: string;
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  notification?: Notification;
  floatingActionButton?: FloatingActionButton;
}

export function AppLayout({
  children,
  title,
  breadcrumbs = [],
  notification,
  floatingActionButton,
}: AppLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set document title
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault();
        setIsSidebarOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show isLoading while checking authentication
  if (isLoading) {
    return (
      <div
        data-testid="app-loading"
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const notificationColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div
      data-testid="app-layout"
      className="flex h-screen bg-gray-100 overflow-hidden"
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        logout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {/* Notification */}
            {notification && (
              <div
                data-testid={`notification-${notification.type}`}
                className={cn(
                  'mb-4 p-4 rounded-md border',
                  notificationColors[notification.type]
                )}
              >
                {notification.message}
              </div>
            )}

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="mb-4">
                <ol className="flex items-center space-x-2 text-sm text-gray-500">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                      {crumb.href ? (
                        <a href={crumb.href} className="hover:text-blue-600">
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900">
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      {floatingActionButton && (
        <button
          data-testid="floating-action-button"
          onClick={floatingActionButton.onClick}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
          title={floatingActionButton.label}
        >
          {floatingActionButton.icon}
        </button>
      )}
    </div>
  );
}
