import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PixVirtualList } from './PixVirtualList';
import type { PixPayment } from '@/types/pix';

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => (
    <div data-testid="virtual-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => {
        const ItemComponent = children;
        return (
          <div key={index}>
            <ItemComponent index={index} style={{}} data={itemData} />
          </div>
        );
      })}
    </div>
  ),
}));

const mockPixPayments: PixPayment[] = [
  {
    id: 1,
    token: 'abc123def456',
    amount: 100.5,
    description: 'Test payment 1',
    status: 'generated',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    expires_at: '2024-01-15T10:15:00Z',
    qr_code_url: 'http://example.com/qr/abc123def456',
    remaining_time: 900,
  },
  {
    id: 2,
    token: 'def456ghi789',
    amount: 250.75,
    description: 'Test payment 2',
    status: 'paid',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
    expires_at: '2024-01-15T09:15:00Z',
    qr_code_url: 'http://example.com/qr/def456ghi789',
    remaining_time: 0,
  },
  {
    id: 3,
    token: 'ghi789jkl012',
    amount: 75.25,
    description: 'Test payment 3',
    status: 'expired',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
    expires_at: '2024-01-15T08:15:00Z',
    qr_code_url: 'http://example.com/qr/ghi789jkl012',
    remaining_time: 0,
  },
];

const mockPagination = {
  currentPage: 1,
  lastPage: 3,
  perPage: 10,
  total: 25,
};

const defaultProps = {
  pixList: mockPixPayments,
  loading: false,
  pagination: mockPagination,
  onRefresh: vi.fn(),
  onPageChange: vi.fn(),
  onStatusFilter: vi.fn(),
};

describe('PixVirtualList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    render(<PixVirtualList {...defaultProps} loading={true} />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('should render empty state when no PIX payments', () => {
    render(<PixVirtualList {...defaultProps} pixList={[]} />);

    expect(screen.getByText('Nenhum PIX encontrado')).toBeInTheDocument();
  });

  it('should render PIX payments in virtual list', () => {
    render(<PixVirtualList {...defaultProps} />);

    expect(screen.getByText('Lista de PIX')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();

    expect(screen.getByText('Test payment 1')).toBeInTheDocument();
    expect(screen.getByText('R$ 100,50')).toBeInTheDocument();
  });

  it('should render different status badges correctly', () => {
    render(<PixVirtualList {...defaultProps} />);

    expect(screen.getAllByText('Pendente')).toHaveLength(1);
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Expirado')).toBeInTheDocument();
  });

  it('should render pagination controls', () => {
    render(<PixVirtualList {...defaultProps} />);

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Total: 25 PIX')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /anterior/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /próxima/i })
    ).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    render(<PixVirtualList {...defaultProps} />);

    const previousButton = screen.getByRole('button', { name: /anterior/i });
    expect(previousButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    const lastPagePagination = { ...mockPagination, currentPage: 3 };
    render(
      <PixVirtualList {...defaultProps} pagination={lastPagePagination} />
    );

    const nextButton = screen.getByRole('button', { name: /próxima/i });
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when pagination buttons are clicked', () => {
    const onPageChange = vi.fn();
    const pagination = { ...mockPagination, currentPage: 2 };
    render(
      <PixVirtualList
        {...defaultProps}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    );

    const previousButton = screen.getByRole('button', { name: /anterior/i });
    const nextButton = screen.getByRole('button', { name: /próxima/i });

    fireEvent.click(previousButton);
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('should handle missing description gracefully', () => {
    const pixWithoutDescription = [
      {
        ...mockPixPayments[0],
        description: undefined,
      },
    ];

    render(
      <PixVirtualList {...defaultProps} pixList={pixWithoutDescription} />
    );

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<PixVirtualList {...defaultProps} />);

    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('should handle null pagination gracefully', () => {
    render(<PixVirtualList {...defaultProps} pagination={null} />);

    // Não deve mostrar controles de paginação
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /anterior/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /próxima/i })
    ).not.toBeInTheDocument();
  });

  it('should handle non-array pixList gracefully', () => {
    render(<PixVirtualList {...defaultProps} pixList={[]} />);

    expect(screen.getByText('Nenhum PIX encontrado')).toBeInTheDocument();
  });
});
