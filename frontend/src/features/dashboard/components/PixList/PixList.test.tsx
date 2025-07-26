import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PixList } from './PixList';
import type { PixPayment } from '@/types/pix';

const mockPixPayments: PixPayment[] = [
  {
    id: 1,
    user_id: 1,
    token: 'abc123',
    amount: 100.5,
    description: 'Pagamento teste 1',
    status: 'generated',
    expires_at: '2025-07-25T15:30:00Z',
    created_at: '2025-07-25T15:00:00Z',
    updated_at: '2025-07-25T15:00:00Z',
    metadata: {},
  },
  {
    id: 2,
    user_id: 1,
    token: 'def456',
    amount: 50.25,
    description: 'Pagamento teste 2',
    status: 'paid',
    expires_at: '2025-07-25T14:30:00Z',
    created_at: '2025-07-25T14:00:00Z',
    updated_at: '2025-07-25T14:15:00Z',
    metadata: {},
  },
  {
    id: 3,
    user_id: 1,
    token: 'ghi789',
    amount: 25.75,
    description: 'Pagamento teste 3',
    status: 'expired',
    expires_at: '2025-07-25T13:30:00Z',
    created_at: '2025-07-25T13:00:00Z',
    updated_at: '2025-07-25T13:30:00Z',
    metadata: {},
  },
];

const mockPagination = {
  currentPage: 1,
  lastPage: 2,
  perPage: 15,
  total: 25,
};

const mockOnRefresh = vi.fn();
const mockOnPageChange = vi.fn();
const mockOnStatusFilter = vi.fn();

describe('PixList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PIX list correctly', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    expect(screen.getByText('Lista de PIX')).toBeInTheDocument();
    expect(screen.getByText('Pagamento teste 1')).toBeInTheDocument();
    expect(screen.getByText('Pagamento teste 2')).toBeInTheDocument();
    expect(screen.getByText('Pagamento teste 3')).toBeInTheDocument();
  });

  it('shows different status badges correctly', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    // Check that all status types appear in the component
    const aguardandoElements = screen.getAllByText('Aguardando');
    const pagoElements = screen.getAllByText('Pago');
    const expiradoElements = screen.getAllByText('Expirado');

    expect(aguardandoElements.length).toBeGreaterThan(0);
    expect(pagoElements.length).toBeGreaterThan(0);
    expect(expiradoElements.length).toBeGreaterThan(0);
  });

  it('displays formatted amounts correctly', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    expect(screen.getByText('R$ 100,50')).toBeInTheDocument();
    expect(screen.getByText('R$ 50,25')).toBeInTheDocument();
    expect(screen.getByText('R$ 25,75')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /atualizar/i });
    await userEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows status filter dropdown', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    expect(screen.getByLabelText(/filtrar por status/i)).toBeInTheDocument();
  });

  it('calls onStatusFilter when filter changes', async () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    const filterSelect = screen.getByLabelText(/filtrar por status/i);
    await userEvent.selectOptions(filterSelect, 'paid');

    expect(mockOnStatusFilter).toHaveBeenCalledWith('paid');
  });

  it('shows loading state', () => {
    render(
      <PixList
        pixList={[]}
        loading={true}
        pagination={null}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('shows empty state when no PIX found', () => {
    render(
      <PixList
        pixList={[]}
        loading={false}
        pagination={null}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    expect(screen.getByText(/nenhum pix encontrado/i)).toBeInTheDocument();
  });

  it('shows pagination controls when pagination is provided', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Total: 25 PIX')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination button is clicked', async () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    const nextButton = screen.getByRole('button', { name: /próxima/i });
    await userEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    const prevButton = screen.getByRole('button', { name: /anterior/i });
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    const lastPagePagination = { ...mockPagination, currentPage: 2 };

    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={lastPagePagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    const nextButton = screen.getByRole('button', { name: /próxima/i });
    expect(nextButton).toBeDisabled();
  });

  it('shows formatted dates correctly', () => {
    render(
      <PixList
        pixList={mockPixPayments}
        loading={false}
        pagination={mockPagination}
        onRefresh={mockOnRefresh}
        onPageChange={mockOnPageChange}
        onStatusFilter={mockOnStatusFilter}
      />
    );

    const dateElements = screen.getAllByText(/25\/07\/2025/i);
    expect(dateElements.length).toBe(3);
  });
});
