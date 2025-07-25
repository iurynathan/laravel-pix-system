import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppLayout } from './AppLayout';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AppLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>App Content</div>
      </AppLayout>
    );

    expect(screen.getByText('App Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <AppLayout>
        <div>App Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
    expect(screen.queryByText('App Content')).not.toBeInTheDocument();
  });

  it('should show loading spinner while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(
      <AppLayout>
        <div>App Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('app-loading')).toBeInTheDocument();
    expect(screen.getByText('Carregando aplicação...')).toBeInTheDocument();
    expect(screen.queryByText('App Content')).not.toBeInTheDocument();
  });

  it('should render header component', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('should render sidebar component', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('should toggle sidebar on mobile when hamburger is clicked', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    const hamburgerButton = screen.getByTestId('mobile-menu-toggle');
    fireEvent.click(hamburgerButton);

    expect(screen.getByTestId('app-sidebar')).toHaveClass('translate-x-0');
  });

  it('should close sidebar when overlay is clicked', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    const hamburgerButton = screen.getByTestId('mobile-menu-toggle');
    fireEvent.click(hamburgerButton);

    const overlay = screen.getByTestId('sidebar-overlay');
    fireEvent.click(overlay);

    expect(screen.getByTestId('app-sidebar')).toHaveClass('-translate-x-full');
  });

  it('should render main content area with proper styling', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div data-testid="main-content">Main Content</div>
      </AppLayout>
    );

    const mainContent = screen.getByTestId('main-content').closest('main');
    expect(mainContent).toHaveClass(
      'flex-1',
      'lg:ml-64',
      'transition-all',
      'duration-300'
    );
  });

  it('should apply responsive layout classes', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    const layout = screen.getByTestId('app-layout');
    expect(layout).toHaveClass('min-h-screen', 'bg-gray-50', 'flex');
  });

  it('should show notification when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout
        notification={{
          type: 'success',
          message: 'Operação realizada com sucesso!',
        }}
      >
        <div>Content</div>
      </AppLayout>
    );

    expect(
      screen.getByText('Operação realizada com sucesso!')
    ).toBeInTheDocument();
    expect(screen.getByTestId('notification-success')).toBeInTheDocument();
  });

  it('should handle custom page title', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout title="Dashboard - PIX System">
        <div>Content</div>
      </AppLayout>
    );

    expect(document.title).toBe('Dashboard - PIX System');
  });

  it('should render breadcrumb when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    const breadcrumbs = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'PIX', href: '/pix' },
      { label: 'Novo PIX' },
    ];

    render(
      <AppLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </AppLayout>
    );

    // Check for breadcrumb by looking for the breadcrumb list
    const breadcrumbList = screen.getByRole('list');
    expect(breadcrumbList).toBeInTheDocument();

    // Check that breadcrumb items are present - focusing on unique breadcrumb content
    expect(screen.getByText('Novo PIX')).toBeInTheDocument();

    // Verify breadcrumb structure contains expected items
    expect(breadcrumbList).toHaveClass('flex', 'items-center', 'space-x-2');
  });

  it('should show floating action button when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout
        floatingActionButton={{
          icon: '+',
          onClick: vi.fn(),
          label: 'Novo PIX',
        }}
      >
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('floating-action-button')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    fireEvent.keyDown(document, { key: 'm', ctrlKey: true });

    expect(screen.getByTestId('app-sidebar')).toHaveClass('translate-x-0');
  });
});
