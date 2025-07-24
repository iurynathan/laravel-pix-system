import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render logo and navigation', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByText('PIX System')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Registrar')).toBeInTheDocument();
  });

  it('should show user menu when authenticated', () => {
    const mockUser = { id: 1, name: 'João Silva', email: 'joao@test.com' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(<Header />);

    // First open the user menu dropdown
    const userButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userButton);

    // Then click the logout button
    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should toggle mobile menu when hamburger is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header />);

    const hamburgerButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(hamburgerButton);

    expect(screen.getByTestId('mobile-menu')).toBeVisible();
  });

  it('should close mobile menu when menu item is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header />);

    const hamburgerButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(hamburgerButton);

    // Verify mobile menu is visible first
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toBeVisible();

    const loginLink = screen.getAllByText('Login')[1]; // Mobile menu link
    fireEvent.click(loginLink);

    expect(mobileMenu).not.toBeVisible();
  });

  it('should show notifications when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByTestId('notifications-button')).toBeInTheDocument();
  });

  it('should apply sticky positioning', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0', 'z-50');
  });

  it('should show profile dropdown when user avatar is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header />);

    const userButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userButton);

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('should close profile dropdown when clicking outside', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header />);

    const userButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userButton);

    // Verify dropdown is open
    expect(screen.getByText('Perfil')).toBeInTheDocument();

    // Click outside to close dropdown
    fireEvent.click(document.body);

    expect(screen.queryByText('Perfil')).not.toBeInTheDocument();
  });
});
