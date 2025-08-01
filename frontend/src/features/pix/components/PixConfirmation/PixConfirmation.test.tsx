import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PixConfirmation } from './PixConfirmation';
import { PixProvider } from '@/context/PixContext';
import { pixService } from '@/services/pix';
import type { PixPayment } from '@/types';

vi.mock('@/services/pix', () => ({
  pixService: {
    confirm: vi.fn(),
    list: vi.fn().mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
      },
    }),
    statistics: vi.fn().mockResolvedValue({
      total_pix: 0,
      generated: 0,
      paid: 0,
      expired: 0,
      total_amount: 0,
      conversion_rate: 0,
    }),
  },
}));

const mockPixService = vi.mocked(pixService);
const mockOnSuccess = vi.fn();
const mockOnError = vi.fn();

const validToken = 'abc123def456';

// Helper para renderizar com PixProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<PixProvider>{component}</PixProvider>);
};

describe('PixConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders confirmation interface correctly', async () => {
    mockPixService.confirm.mockResolvedValue({
      success: true,
      message: 'Pagamento confirmado',
      status: 'paid',
      pix: {
        id: 1,
        user_id: 1,
        token: validToken,
        amount: 100.5,
        description: 'Test payment',
        status: 'paid',
        expires_at: '2025-01-24T10:15:00Z',
        paid_at: '2025-01-24T10:05:00Z',
        metadata: {},
        created_at: '2025-01-24T10:00:00Z',
        updated_at: '2025-01-24T10:05:00Z',
      },
    });

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('pix-confirmation-result')).toBeInTheDocument();
    });
  });

  it('confirms payment successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Pagamento confirmado com sucesso!',
      status: 'paid' as const,
      pix: {
        id: 1,
        user_id: 1,
        token: validToken,
        amount: 100.5,
        description: 'Pagamento confirmado',
        status: 'paid' as const,
        expires_at: '2025-01-24T10:15:00Z',
        paid_at: '2025-01-24T10:05:00Z',
        metadata: {},
        created_at: '2025-01-24T10:00:00Z',
        updated_at: '2025-01-24T10:05:00Z',
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockPixService.confirm).toHaveBeenCalledWith(validToken);
      expect(screen.getByText('Pagamento Confirmado!')).toBeInTheDocument();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.pix);
    });
  });

  it('handles expired PIX', async () => {
    const mockResponse = {
      success: false,
      message: 'PIX expirado',
      status: 'expired' as const,
      pix: {
        id: 1,
        user_id: 1,
        token: validToken,
        amount: 100.5,
        description: 'PIX expirado',
        status: 'expired' as const,
        expires_at: '2025-01-24T10:15:00Z',
        metadata: {},
        created_at: '2025-01-24T10:00:00Z',
        updated_at: '2025-01-24T10:15:00Z',
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /PIX Expirado/i })
      ).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('PIX expirado');
    });
  });

  it('handles API errors during confirmation', async () => {
    const errorMessage = 'Token inválido';
    mockPixService.confirm.mockRejectedValue(new Error(errorMessage));

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      expect(screen.getByText('Erro na Confirmação')).toBeInTheDocument();
    });
  });

  it('shows loading state during confirmation', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise<{
      success: boolean;
      message: string;
      status: 'paid' | 'expired' | 'already_paid' | 'not_found' | 'error';
      pix?: PixPayment | undefined;
    }>(resolve => {
      resolvePromise = resolve;
    });
    mockPixService.confirm.mockReturnValue(promise);

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Verificando PIX.../i)).toBeInTheDocument();

    resolvePromise!({
      success: true,
      message: 'Pagamento confirmado',
      status: 'paid',
      pix: {
        id: 1,
        token: validToken,
        status: 'paid',
        amount: 100.5,
        description: 'Test',
        expires_at: '2025-01-24T10:15:00Z',
        created_at: '2025-01-24T10:00:00Z',
        updated_at: '2025-01-24T10:05:00Z',
        user_id: 1,
        metadata: {},
      },
    });
  });

  it('handles invalid token format', () => {
    renderWithProvider(
      <PixConfirmation
        token=""
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/token inválido/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirmar pagamento/i })
    ).not.toBeInTheDocument();
  });

  it('displays helpful information about PIX confirmation', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise<{
      success: boolean;
      message: string;
      status: 'paid' | 'expired' | 'already_paid' | 'not_found' | 'error';
      pix?: PixPayment | undefined;
    }>(resolve => {
      resolvePromise = resolve;
    });
    mockPixService.confirm.mockReturnValue(promise);

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(
      screen.getByText(/O pagamento será verificado automaticamente/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Após a confirmação/i)).toBeInTheDocument();

    resolvePromise!({
      success: true,
      message: 'Test',
      status: 'paid',
      pix: {
        id: 1,
        token: validToken,
        status: 'paid',
        amount: 100,
        description: '',
        expires_at: '',
        created_at: '',
        updated_at: '',
        user_id: 1,
        metadata: {},
      },
    });
  });

  it('handles not found PIX', async () => {
    const mockResponse = {
      success: false,
      message: 'PIX não encontrado',
      status: 'not_found' as const,
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /PIX Não Encontrado/i })
      ).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('PIX não encontrado');
    });
  });

  it('handles already paid PIX', async () => {
    const mockResponse = {
      success: true,
      message: 'PIX já foi pago anteriormente',
      status: 'already_paid' as const,
      pix: {
        id: 1,
        user_id: 1,
        token: validToken,
        amount: 100.5,
        description: 'Already paid',
        status: 'paid' as const,
        expires_at: '2025-01-24T10:15:00Z',
        paid_at: '2025-01-24T10:00:00Z',
        metadata: {},
        created_at: '2025-01-24T10:00:00Z',
        updated_at: '2025-01-24T10:05:00Z',
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    renderWithProvider(
      <PixConfirmation
        token={validToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('PIX Já Pago')).toBeInTheDocument();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.pix);
    });
  });
});
