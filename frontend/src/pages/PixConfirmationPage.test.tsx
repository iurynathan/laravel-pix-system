import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PixConfirmationPage } from './PixConfirmationPage';

const mockNavigate = vi.fn();
const mockParams = { token: 'abc123def456' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

vi.mock('@/components/templates/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock('@/features/pix/components/PixConfirmation', () => ({
  PixConfirmation: ({ token, onSuccess, onError }: any) => (
    <div data-testid="pix-confirmation">
      <p>Token: {token}</p>
      <button
        onClick={() =>
          onSuccess({
            id: 1,
            token,
            status: 'paid',
            amount: 100.5,
            description: 'Test payment',
            user_id: 1,
            expires_at: '2025-07-24T15:30:00Z',
            paid_at: '2025-07-24T15:25:00Z',
            created_at: '2025-07-24T15:15:00Z',
            updated_at: '2025-07-24T15:25:00Z',
            metadata: {},
          })
        }
      >
        Success
      </button>
      <button onClick={() => onError('Test error')}>Error</button>
    </div>
  ),
}));

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PixConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.token = 'abc123def456';
  });

  it('should render confirmation interface with token', () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    expect(screen.getByText('Confirmação de Pagamento')).toBeInTheDocument();
    expect(screen.getByTestId('pix-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Token: abc123def456')).toBeInTheDocument();
  });

  it('should show error when token is missing', () => {
    mockParams.token = undefined as any;

    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    expect(screen.getByText('Token Inválido')).toBeInTheDocument();
    expect(
      screen.getByText(/token pix não foi fornecido/i)
    ).toBeInTheDocument();
  });

  it('should show error when token is empty', () => {
    mockParams.token = '';

    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    expect(screen.getByText('Token Inválido')).toBeInTheDocument();
    expect(
      screen.getByText(/token pix não foi fornecido/i)
    ).toBeInTheDocument();
  });

  it('should navigate to dashboard on back button click', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    const backButton = screen.getByRole('button', { name: /voltar/i });
    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle successful confirmation', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    const successButton = screen.getByRole('button', { name: 'Success' });
    await userEvent.click(successButton);

    // Should show success message
    await waitFor(() => {
      expect(
        screen.getByText(/pagamento confirmado com sucesso/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle confirmation error', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    const errorButton = screen.getByRole('button', { name: 'Error' });
    await userEvent.click(errorButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('should show try again button on error', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    const errorButton = screen.getByRole('button', { name: 'Error' });
    await userEvent.click(errorButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /tentar novamente/i })
      ).toBeInTheDocument();
    });
  });

  it('should retry confirmation when try again is clicked', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    // Trigger error first
    const errorButton = screen.getByRole('button', { name: 'Error' });
    await userEvent.click(errorButton);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    // Click try again
    const tryAgainButton = screen.getByRole('button', {
      name: /tentar novamente/i,
    });
    await userEvent.click(tryAgainButton);

    // Should reset the state and show confirmation interface again
    expect(screen.getByTestId('pix-confirmation')).toBeInTheDocument();
  });

  it('should display helpful information about PIX confirmation', () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    expect(screen.getByText(/escaneou o qr code/i)).toBeInTheDocument();
    expect(screen.getByText(/confirme o pagamento/i)).toBeInTheDocument();
  });

  it('should show success actions after confirmation', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    const successButton = screen.getByRole('button', { name: 'Success' });
    await userEvent.click(successButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /voltar ao dashboard/i })
      ).toBeInTheDocument();
    });
  });

  it('should navigate to dashboard after successful confirmation', async () => {
    render(
      <MockWrapper>
        <PixConfirmationPage />
      </MockWrapper>
    );

    const successButton = screen.getByRole('button', { name: 'Success' });
    await userEvent.click(successButton);

    await waitFor(() => {
      const dashboardButton = screen.getByRole('button', {
        name: /voltar ao dashboard/i,
      });
      expect(dashboardButton).toBeInTheDocument();
    });

    const dashboardButton = screen.getByRole('button', {
      name: /voltar ao dashboard/i,
    });
    await userEvent.click(dashboardButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
