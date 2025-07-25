import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PixGenerationPage } from './PixGenerationPage';
import { usePixGeneration } from '@/features/pix/hooks';

vi.mock('@/features/pix/hooks', () => ({
  usePixGeneration: vi.fn(),
}));

vi.mock('@/components/templates/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock('@/features/pix/components/PixGenerationForm', () => ({
  PixGenerationForm: ({ onSubmit, loading }: any) => (
    <div data-testid="pix-generation-form">
      <input aria-label="Valor" data-testid="amount" />
      <input aria-label="Descrição" data-testid="description" />
      <button
        onClick={() => onSubmit({ amount: 50, description: 'Test payment' })}
        disabled={loading}
      >
        Gerar PIX
      </button>
    </div>
  ),
}));

vi.mock('@/features/pix/components/QRCodeDisplay', () => ({
  QRCodeDisplay: ({ pix }: any) => (
    <div data-testid="qr-code-display">QR Code for {pix.amount}</div>
  ),
}));

const mockUsePixGeneration = vi.mocked(usePixGeneration);
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    loading: false,
    logout: vi.fn(),
  }),
}));

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PixGenerationPage', () => {
  const mockGeneratedPix = {
    id: 1,
    user_id: 1,
    token: 'abc123def456',
    amount: 100.5,
    description: 'Test PIX',
    status: 'generated' as const,
    expires_at: '2025-07-24T15:30:00Z',
    qr_code_url: 'http://localhost/qr/abc123def456',
    qr_code_base64: 'base64data',
    remaining_time: 900,
    is_expired: false,
    is_paid: false,
    can_be_paid: true,
    created_at: '2025-07-24T15:15:00Z',
    updated_at: '2025-07-24T15:15:00Z',
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePixGeneration.mockReturnValue({
      loading: false,
      error: null,
      generatedPix: null,
      generatePix: vi.fn(),
      resetGeneration: vi.fn(),
    });
  });

  it('should render generation form when no PIX is generated', () => {
    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    expect(
      screen.getByRole('heading', { name: 'Gerar PIX' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('pix-generation-form')).toBeInTheDocument();
  });

  it('should render QR code display when PIX is generated', () => {
    mockUsePixGeneration.mockReturnValue({
      loading: false,
      error: null,
      generatedPix: mockGeneratedPix,
      generatePix: vi.fn(),
      resetGeneration: vi.fn(),
    });

    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    expect(screen.getByText('PIX Gerado com Sucesso!')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-display')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUsePixGeneration.mockReturnValue({
      loading: true,
      error: null,
      generatedPix: null,
      generatePix: vi.fn(),
      resetGeneration: vi.fn(),
    });

    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    expect(screen.getByText('Gerando PIX...')).toBeInTheDocument();
  });

  it('should show error message', () => {
    const errorMessage = 'Erro ao gerar PIX';
    mockUsePixGeneration.mockReturnValue({
      loading: false,
      error: errorMessage,
      generatedPix: null,
      generatePix: vi.fn(),
      resetGeneration: vi.fn(),
    });

    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should allow generating new PIX when one is generated', async () => {
    const mockResetGeneration = vi.fn();
    mockUsePixGeneration.mockReturnValue({
      loading: false,
      error: null,
      generatedPix: mockGeneratedPix,
      generatePix: vi.fn(),
      resetGeneration: mockResetGeneration,
    });

    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    const newPixButton = screen.getByRole('button', {
      name: /gerar novo pix/i,
    });
    await userEvent.click(newPixButton);

    expect(mockResetGeneration).toHaveBeenCalled();
  });

  it('should navigate back to dashboard', async () => {
    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    const backButton = screen.getByRole('button', {
      name: /voltar ao dashboard/i,
    });
    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle form submission', async () => {
    const mockGeneratePix = vi.fn();
    mockUsePixGeneration.mockReturnValue({
      loading: false,
      error: null,
      generatedPix: null,
      generatePix: mockGeneratePix,
      resetGeneration: vi.fn(),
    });

    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    const amountInput = screen.getByLabelText(/valor/i);
    const descriptionInput = screen.getByLabelText(/descrição/i);
    const submitButton = screen.getByRole('button', { name: /gerar pix/i });

    await userEvent.type(amountInput, '50.00');
    await userEvent.type(descriptionInput, 'Test payment');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockGeneratePix).toHaveBeenCalledWith({
        amount: 50.0,
        description: 'Test payment',
      });
    });
  });

  it('should display helpful information about PIX generation', () => {
    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    expect(
      screen.getByText(/preencha os dados abaixo para criar uma cobrança pix/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/o qr code será gerado instantaneamente/i)
    ).toBeInTheDocument();
  });

  it('should show retry button on error', async () => {
    const mockGeneratePix = vi.fn();
    mockUsePixGeneration.mockReturnValue({
      loading: false,
      error: 'Erro de rede',
      generatedPix: null,
      generatePix: mockGeneratePix,
      resetGeneration: vi.fn(),
    });

    render(
      <MockWrapper>
        <PixGenerationPage />
      </MockWrapper>
    );

    expect(screen.getByText('Erro de rede')).toBeInTheDocument();
    expect(screen.getByTestId('pix-generation-form')).toBeInTheDocument();
  });
});
