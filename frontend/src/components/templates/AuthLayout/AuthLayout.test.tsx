import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthLayout } from './AuthLayout';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-to">{to}</div>
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Auth Form Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Auth Form Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
  });

  it('should redirect to dashboard when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Auth Form Content</div>
      </AuthLayout>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/dashboard');
    expect(screen.queryByText('Auth Form Content')).not.toBeInTheDocument();
  });

  it('should show loading spinner while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <AuthLayout>
        <div>Auth Form Content</div>
      </AuthLayout>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Auth Form Content')).not.toBeInTheDocument();
  });

  it('should render layout with proper structure', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Auth Content</div>
      </AuthLayout>
    );

    const layout = screen.getByTestId('auth-layout');
    expect(layout).toHaveClass(
      'min-h-screen',
      'bg-gray-50',
      'flex',
      'flex-col',
      'justify-center'
    );
  });

  it('should render brand section with logo and title', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('PIX System')).toBeInTheDocument();
    expect(
      screen.getByText('Sistema de Pagamentos Instantâneos')
    ).toBeInTheDocument();
    expect(screen.getByTestId('brand-logo')).toBeInTheDocument();
  });

  it('should render main content area with proper styling', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div data-testid="form-content">Form Content</div>
      </AuthLayout>
    );

    const formContent = screen.getByTestId('form-content');
    const contentArea = formContent.parentElement;
    expect(contentArea).toHaveClass('max-w-md', 'w-full', 'space-y-8');
  });

  it('should render footer with copyright information', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText(/© 2024 PIX System/)).toBeInTheDocument();
    expect(
      screen.getByText('Todos os direitos reservados')
    ).toBeInTheDocument();
  });

  it('should apply responsive design classes', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    const container = screen.getByTestId('auth-container');
    expect(container).toHaveClass('sm:mx-auto', 'sm:w-full', 'sm:max-w-md');
  });

  it('should render with gradient background', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    const layout = screen.getByTestId('auth-layout');
    expect(layout).toHaveClass(
      'bg-gradient-to-br',
      'from-blue-50',
      'to-indigo-100'
    );
  });

  it('should show security notice', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    expect(
      screen.getByText('🔒 Suas informações estão seguras')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Utilizamos criptografia de ponta/)
    ).toBeInTheDocument();
  });

  it('should handle custom title when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout title="Página de Login">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('should handle custom subtitle when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <AuthLayout subtitle="Acesse sua conta">
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
  });
});
