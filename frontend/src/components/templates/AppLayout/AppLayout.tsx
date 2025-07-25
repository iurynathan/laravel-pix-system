import { type ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  const { isAuthenticated, isLoading } = useAuth();
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const notificationColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div data-testid="app-layout" className="min-h-screen bg-gray-50 flex">
      {/* Header */}
      <div data-testid="app-header" className="fixed top-0 left-0 right-0 z-40">
        <Header />
        {/* Mobile menu toggle - embedded in header area for mobile */}
        <button
          data-testid="mobile-menu-toggle"
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md text-gray-700 hover:text-blue-600"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        data-testid="app-sidebar"
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-30 lg:z-10 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:top-0 lg:h-screen',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <main
          className={cn(
            'flex-1 lg:ml-64 transition-all duration-300 pt-16',
            'min-h-[calc(100vh-4rem)]'
          )}
        >
          {/* Notification */}
          {notification && (
            <div
              data-testid={`notification-${notification.type}`}
              className={cn(
                'mx-4 mt-4 p-4 rounded-md border',
                notificationColors[notification.type]
              )}
            >
              {notification.message}
            </div>
          )}

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="px-4 pt-4 pb-2">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg
                        className="w-4 h-4 mx-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
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
          <div className="p-4">{children}</div>
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
