import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const mockUseLocation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar Component', () => {
  const renderSidebar = (props: any) => {
    return render(
      <MemoryRouter>
        <Sidebar {...props} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
    mockUseAuth.mockReturnValue({
      logout: vi.fn(),
    });
  });

  it('should render all navigation items', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    mockUseLocation.mockReturnValue({ pathname: '/pix' });

    renderSidebar({ isOpen: true, onClose: vi.fn() });

    const pixLink = screen.getByText('PIX').closest('a');
    expect(pixLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('should not be visible when isOpen is false', () => {
    renderSidebar({ isOpen: false, onClose: vi.fn() });

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('should be visible when isOpen is true', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ isOpen: true, onClose });

    const overlay = screen.getByTestId('sidebar-overlay');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ isOpen: true, onClose });

    const closeButton = screen.getByTestId('sidebar-close-button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when sidebar content is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ isOpen: true, onClose });

    const sidebarContent = screen.getByTestId('sidebar-content');
    fireEvent.click(sidebarContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should show user information section', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    expect(screen.getByTestId('user-info')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('should render navigation icons', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('pix-icon')).toBeInTheDocument();
    expect(screen.getByTestId('reports-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('should apply mobile responsive classes', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('md:translate-x-0', 'md:static', 'md:inset-0');
  });

  it('should show logout option at bottom', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    expect(screen.getByText('Sair')).toBeInTheDocument();
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  it('should group navigation items by category', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn() });

    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Ferramentas')).toBeInTheDocument();
  });

  it('should show badge on PIX menu item when there are notifications', () => {
    renderSidebar({ isOpen: true, onClose: vi.fn(), hasNotifications: true });

    expect(screen.getByTestId('pix-notification-badge')).toBeInTheDocument();
  });
});
