import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PixGenerationForm } from './PixGenerationForm';
import { pixService } from '@/services/pix';
import type { PixPayment } from '@/types';

vi.mock('@/services/pix', () => ({
  pixService: {
    create: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

const mockOnSuccess = vi.fn();
const mockOnError = vi.fn();

describe('PixGenerationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <PixGenerationForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /gerar pix/i })
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <PixGenerationForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const submitButton = screen.getByRole('button', { name: /gerar pix/i });

    await userEvent.click(submitButton);

    expect(screen.getByText(/valor é obrigatório/i)).toBeInTheDocument();
  });

  it('validates minimum amount', async () => {
    render(
      <PixGenerationForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const amountInput = screen.getByLabelText(/valor/i);
    const submitButton = screen.getByRole('button', { name: /gerar pix/i });

    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '0');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valor mínimo é r\$ 0,01/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockPixData = {
      id: 1,
      user_id: 1,
      token: 'abc123',
      amount: '50.25',
      description: 'Teste PIX',
      status: 'generated' as const,
      expires_at: '2025-01-24T10:15:00Z',
      created_at: '2025-01-24T10:00:00Z',
      updated_at: '2025-01-24T10:00:00Z',
      metadata: {},
    };

    mockPixService.create.mockResolvedValue(mockPixData);

    render(
      <PixGenerationForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const amountInput = screen.getByLabelText(/valor/i);
    const descriptionInput = screen.getByLabelText(/descrição/i);
    const submitButton = screen.getByRole('button', { name: /gerar pix/i });

    await userEvent.type(amountInput, '50.25');
    await userEvent.type(descriptionInput, 'Teste PIX');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPixService.create).toHaveBeenCalledWith({
        amount: 50.25,
        description: 'Teste PIX',
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockPixData);
  });

  it('handles API errors', async () => {
    const errorMessage = 'Erro ao gerar PIX';
    mockPixService.create.mockRejectedValue(new Error(errorMessage));

    render(
      <PixGenerationForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const amountInput = screen.getByLabelText(/valor/i);
    const submitButton = screen.getByRole('button', { name: /gerar pix/i });

    await userEvent.type(amountInput, '100');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: PixPayment | PromiseLike<PixPayment>) => void;
    const promise = new Promise<PixPayment>(resolve => {
      resolvePromise = resolve;
    });
    mockPixService.create.mockReturnValue(promise);

    render(
      <PixGenerationForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const amountInput = screen.getByLabelText(/valor/i);
    const submitButton = screen.getByRole('button', { name: /gerar pix/i });

    await userEvent.type(amountInput, '100');
    await userEvent.click(submitButton);

    expect(screen.getByText(/gerando.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolvePromise!({
      id: 1,
      user_id: 1,
      token: 'test',
      status: 'generated',
      amount: '100',
      description: '',
      expires_at: '',
      created_at: '',
      updated_at: '',
      metadata: {},
    });
  });
});
