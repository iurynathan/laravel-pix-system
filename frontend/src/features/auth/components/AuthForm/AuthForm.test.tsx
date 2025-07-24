import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm';

// Mock do useAuth
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      clearError: vi.fn(),
      isLoading: false,
      error: null,
    });
  });

  it('renders login form by default', () => {
    render(<AuthForm />);

    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByText('Não tem conta? Cadastre-se')).toBeInTheDocument();
  });

  it('switches to register mode', async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    await user.click(screen.getByText('Não tem conta? Cadastre-se'));

    expect(screen.getByText('Cadastrar')).toBeInTheDocument();
    expect(screen.getByText('Já tem conta? Entre')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
  });

  it('switches back to login mode', async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    // Switch to register
    await user.click(screen.getByText('Não tem conta? Cadastre-se'));
    // Switch back to login
    await user.click(screen.getByText('Já tem conta? Entre'));

    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      clearError: vi.fn(),
      isLoading: true,
      error: null,
    });

    render(<AuthForm />);

    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message', () => {
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      clearError: vi.fn(),
      isLoading: false,
      error: 'Invalid credentials',
    });

    render(<AuthForm />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
