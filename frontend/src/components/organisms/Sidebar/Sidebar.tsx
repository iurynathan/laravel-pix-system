import { type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, X, Plus } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { User } from '@/types/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  logout: () => void;
}

export function Sidebar({ isOpen, onClose, user, logout }: SidebarProps) {
  const location = useLocation();

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      category: 'Principal',
      items: [
        {
          path: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          path: '/pix/create',
          label: 'Criar PIX',
          icon: Plus,
        },
      ],
    },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-gray-900/75 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="mobile-sidebar"
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50',
          'lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div
          data-testid="sidebar-content"
          onClick={handleContentClick}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link
              to="/"
              className="text-xl font-bold text-blue-600 max-lg:hidden"
            >
              PIX System
            </Link>
            <button
              data-testid="sidebar-close-button"
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 min-w-0">
                <p className="font-semibold text-gray-800 truncate block">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500 truncate block">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
            {navigationItems.map(section => (
              <div key={section.category}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive(item.path)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
