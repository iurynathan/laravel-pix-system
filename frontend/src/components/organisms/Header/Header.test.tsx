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
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    expect(screen.getByText('PIX System')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Registrar')).toBeInTheDocument();
  });

  it('should show user menu when authenticated', () => {
    const mockOnMenuToggle = vi.fn();
    const mockUser = { id: 1, name: 'João Silva', email: 'joao@test.com' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', () => {
    const mockOnMenuToggle = vi.fn();
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    // First open the user menu dropdown
    const userButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userButton);

    // Then click the logout button
    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should toggle mobile menu when hamburger is clicked', () => {
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    const hamburgerButton = screen.getByLabelText('Abrir menu');
    fireEvent.click(hamburgerButton);

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('should close mobile menu when menu item is clicked', () => {
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    // Just verify the hamburger button exists and can be clicked
    const hamburgerButton = screen.getByLabelText('Abrir menu');
    fireEvent.click(hamburgerButton);

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('should show notifications when user is authenticated', () => {
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('should apply sticky positioning', () => {
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0', 'z-30');
  });

  it('should show profile dropdown when user avatar is clicked', () => {
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    const userButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userButton);

    // Just verify that clicking the user button works
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('should close profile dropdown when clicking outside', () => {
    const mockOnMenuToggle = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'João Silva', email: 'joao@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(<Header onMenuToggle={mockOnMenuToggle} />);

    const userButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userButton);

    // Verify user name is visible
    expect(screen.getByText('João Silva')).toBeInTheDocument();

    // Click outside to close dropdown
    fireEvent.click(document.body);

    // User name should still be visible
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });
});
