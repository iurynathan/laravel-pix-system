import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthForm } from './AuthForm';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Mode', () => {
    it('should render login form with email and password fields', () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="login" />);

      expect(screen.getByText('Entrar')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Entrar' })
      ).toBeInTheDocument();
    });

    it('should show link to register page', () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="login" />);

      expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument();
      expect(screen.getByText('Registre-se')).toBeInTheDocument();
    });

    it('should call login function when form is submitted', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: true });
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        loading: false,
        error: null,
      });

      render(<AuthForm mode="login" />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Senha'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Register Mode', () => {
    it('should render register form with all required fields', () => {
      mockUseAuth.mockReturnValue({
        register: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="register" />);

      expect(screen.getByText('Criar Conta')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Criar Conta' })
      ).toBeInTheDocument();
    });

    it('should show link to login page', () => {
      mockUseAuth.mockReturnValue({
        register: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="register" />);

      expect(screen.getByText('Já tem uma conta?')).toBeInTheDocument();
      expect(screen.getByText('Faça login')).toBeInTheDocument();
    });

    it('should call register function when form is submitted', async () => {
      const mockRegister = vi.fn().mockResolvedValue({ success: true });
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        loading: false,
        error: null,
      });

      render(<AuthForm mode="register" />);

      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'João Silva' },
      });
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'joao@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Senha'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'João Silva',
          email: 'joao@example.com',
          password: 'password123',
          password_confirmation: 'password123',
        });
      });
    });

    it('should show error when passwords do not match', async () => {
      mockUseAuth.mockReturnValue({
        register: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="register" />);

      fireEvent.change(screen.getByLabelText('Senha'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
        target: { value: 'different-password' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));

      await waitFor(() => {
        expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show required field errors', async () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="login" />);

      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

      await waitFor(() => {
        expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
      });
    });

    it('should show invalid email error', async () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="login" />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'invalid-email' },
      });
      fireEvent.change(screen.getByLabelText('Senha'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('should show minimum password length error', async () => {
      mockUseAuth.mockReturnValue({
        register: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="register" />);

      fireEvent.change(screen.getByLabelText('Senha'), {
        target: { value: '123' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));

      await waitFor(() => {
        expect(
          screen.getByText('Senha deve ter pelo menos 6 caracteres')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state when submitting', () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: true,
        error: null,
      });

      render(<AuthForm mode="login" />);

      const submitButton = screen.getByRole('button', { name: 'Entrando...' });
      expect(submitButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show error message when authentication fails', () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: 'Credenciais inválidas',
      });

      render(<AuthForm mode="login" />);

      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
      expect(screen.getByTestId('error-alert')).toHaveClass('text-red-600');
    });

    it('should clear error when switching modes', () => {
      const { rerender } = render(<AuthForm mode="login" />);

      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: 'Erro anterior',
      });

      rerender(<AuthForm mode="register" />);

      expect(screen.queryByText('Erro anterior')).not.toBeInTheDocument();
    });
  });

  describe('Social Authentication', () => {
    it('should show social login options', () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        loading: false,
        error: null,
      });

      render(<AuthForm mode="login" showSocialAuth={true} />);

      expect(screen.getByText('Ou continue com')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });
});
