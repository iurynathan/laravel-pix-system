import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePixPage } from './CreatePixPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Mock AppLayout, Card, Button
vi.mock('@/components/templates/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));
vi.mock('@/components/molecules', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/atoms', () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock usePixContext
const mockCreatePix = vi.fn();
const mockPixContext = {
  createPix: mockCreatePix,
  loading: false,
};
vi.mock('@/context/PixContext', () => ({
  usePixContext: () => mockPixContext,
}));

function renderPage() {
  return render(<CreatePixPage />);
}

describe('CreatePixPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPixContext.loading = false;
  });

  it('should render form and preview', () => {
    renderPage();
    expect(screen.getByLabelText(/Valor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByText(/Preview do PIX/i)).toBeInTheDocument();
  });

  it('should show error for invalid amount', async () => {
    renderPage();
    const amountInput = screen.getByLabelText(/Valor/i);
    await userEvent.type(amountInput, '0');
    const submitBtn = screen.getByRole('button', { name: /Criar PIX/i });
    await userEvent.click(submitBtn);
    expect(
      await screen.findByText(/Valor deve ser maior que zero/i)
    ).toBeInTheDocument();
    expect(mockCreatePix).not.toHaveBeenCalled();
  });

  it('should show error for amount above maximum', async () => {
    renderPage();
    const amountInput = screen.getByLabelText(/Valor/i);
    await userEvent.type(amountInput, '100000');
    const submitBtn = screen.getByRole('button', { name: /Criar PIX/i });
    await userEvent.click(submitBtn);
    expect(await screen.findByText(/Valor máximo/i)).toBeInTheDocument();
    expect(mockCreatePix).not.toHaveBeenCalled();
  });

  it('should call createPix and navigate on success', async () => {
    mockCreatePix.mockResolvedValue({ id: 123 });
    renderPage();
    const amountInput = screen.getByLabelText(/Valor/i);
    await userEvent.type(amountInput, '100');
    const submitBtn = screen.getByRole('button', { name: /Criar PIX/i });
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockCreatePix).toHaveBeenCalledWith({
        amount: 100,
        description: undefined,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/pix/details/123');
    });
  });

  it('should not call createPix if form is invalid', async () => {
    renderPage();
    // Não digita nada, campo já está vazio
    const submitBtn = screen.getByRole('button', { name: /Criar PIX/i });
    await userEvent.click(submitBtn);
    expect(mockCreatePix).not.toHaveBeenCalled();
  });

  it('should disable submit button when loading or submitting', async () => {
    mockPixContext.loading = true;
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /Criando PIX/i });
    expect(submitBtn).toBeDisabled();
  });

  it('should show formatted preview amount and description', async () => {
    renderPage();
    const amountInput = screen.getByLabelText(/Valor/i);
    const descInput = screen.getByLabelText(/Descrição/i);
    await userEvent.type(amountInput, '123,45');
    await userEvent.type(descInput, 'Test payment');
    expect(screen.getByText('R$ 123,45')).toBeInTheDocument();
    const descMatches = screen.getAllByText(/Test payment/i);
    expect(descMatches.length).toBeGreaterThan(0);
  });
});
