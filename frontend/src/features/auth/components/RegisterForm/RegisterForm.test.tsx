import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

// Mock do useAuth
const mockRegister = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    clearError: mockClearError,
    loading: false,
    error: null,
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.type(screen.getByLabelText('Email'), 'joao@example.com');
    await user.type(screen.getByLabelText('Senha'), 'password123');
    await user.type(screen.getByLabelText('Confirmar Senha'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      });
    });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.type(screen.getByLabelText('Email'), 'joao@example.com');
    await user.type(screen.getByLabelText('Senha'), 'password123');
    await user.type(screen.getByLabelText('Confirmar Senha'), 'different');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('Senhas não coincidem')).toBeInTheDocument();
  });

  it('validates minimum password length', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Senha'), '123');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument();
  });
});