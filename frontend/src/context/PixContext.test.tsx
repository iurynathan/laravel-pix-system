import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PixProvider, usePixContext } from './PixContext';
import { pixService } from '@/services/pix';
import type { PixPayment } from '@/types/pix';

vi.mock('@/services/pix', () => ({
  pixService: {
    list: vi.fn(),
    create: vi.fn(),
    confirm: vi.fn(),
    statistics: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

// Test component to interact with context
function TestComponent() {
  const {
    pixList,
    loading,
    error,
    statistics,
    fetchPixList,
    createPix,
    confirmPix,
    fetchStatistics,
    clearError,
  } = usePixContext();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="pix-count">{pixList.length}</div>
      <div data-testid="statistics">
        {statistics ? `${statistics.total} total` : 'no-stats'}
      </div>

      <button onClick={() => fetchPixList()}>Fetch PIX List</button>
      <button onClick={() => createPix({ amount: 100, description: 'Test' })}>
        Create PIX
      </button>
      <button onClick={() => confirmPix('abc123')}>Confirm PIX</button>
      <button onClick={() => fetchStatistics()}>Fetch Stats</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <PixProvider>{children}</PixProvider>;
}

describe('PixContext', () => {
  const mockPixPayment: PixPayment = {
    id: 1,
    user_id: 1,
    token: 'abc123',
    amount: 100.5,
    description: 'Test PIX',
    status: 'generated',
    expires_at: '2025-07-24T15:30:00Z',
    created_at: '2025-07-24T15:15:00Z',
    updated_at: '2025-07-24T15:15:00Z',
    metadata: {},
  };

  const mockStatistics = {
    total: 10,
    generated: 5,
    paid: 3,
    expired: 2,
    total_amount: 1500.75,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state correctly', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('pix-count')).toHaveTextContent('0');
    expect(screen.getByTestId('statistics')).toHaveTextContent('no-stats');
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePixContext deve ser usado dentro de um PixProvider');

    consoleSpy.mockRestore();
  });

  it('should fetch PIX list successfully', async () => {
    const mockResponse = {
      data: [mockPixPayment],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
        count: 1,
        has_more_pages: false,
      },
    };

    mockPixService.list.mockResolvedValue(mockResponse);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const fetchButton = screen.getByRole('button', { name: 'Fetch PIX List' });
    await act(async () => {
      await userEvent.click(fetchButton);
    });

    expect(screen.getByTestId('pix-count')).toHaveTextContent('1');
    expect(mockPixService.list).toHaveBeenCalledWith(1, undefined);
  });

  it('should handle PIX list fetch error', async () => {
    const errorMessage = 'Failed to fetch PIX list';
    mockPixService.list.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const fetchButton = screen.getByRole('button', { name: 'Fetch PIX List' });
    await act(async () => {
      await userEvent.click(fetchButton);
    });

    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('pix-count')).toHaveTextContent('0');
  });

  it('should create PIX successfully', async () => {
    mockPixService.create.mockResolvedValue(mockPixPayment);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: 'Create PIX' });
    await act(async () => {
      await userEvent.click(createButton);
    });

    expect(mockPixService.create).toHaveBeenCalledWith({
      amount: 100,
      description: 'Test',
    });
  });

  it('should handle PIX creation error', async () => {
    const errorMessage = 'Failed to create PIX';
    mockPixService.create.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: 'Create PIX' });
    await act(async () => {
      await userEvent.click(createButton);
    });

    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
  });

  it('should confirm PIX successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'PIX confirmado',
      status: 'paid' as const,
      pix: { ...mockPixPayment, status: 'paid' as const },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm PIX' });
    await act(async () => {
      await userEvent.click(confirmButton);
    });

    expect(mockPixService.confirm).toHaveBeenCalledWith('abc123');
  });

  it('should handle PIX confirmation error', async () => {
    const errorMessage = 'PIX not found';
    mockPixService.confirm.mockResolvedValue({
      success: false,
      message: errorMessage,
      status: 'not_found',
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm PIX' });
    await act(async () => {
      try {
        await userEvent.click(confirmButton);
      } catch {
        // Expected error from context, ignore
      }
    });

    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
  });

  it('should fetch statistics successfully', async () => {
    mockPixService.statistics.mockResolvedValue(mockStatistics);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const statsButton = screen.getByRole('button', { name: 'Fetch Stats' });
    await act(async () => {
      await userEvent.click(statsButton);
    });

    expect(screen.getByTestId('statistics')).toHaveTextContent('10 total');
    expect(mockPixService.statistics).toHaveBeenCalled();
  });

  it('should handle statistics fetch error', async () => {
    const errorMessage = 'Failed to fetch statistics';
    mockPixService.statistics.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const statsButton = screen.getByRole('button', { name: 'Fetch Stats' });
    await act(async () => {
      await userEvent.click(statsButton);
    });

    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
  });

  it('should clear error when clearError is called', async () => {
    const errorMessage = 'Test error';
    mockPixService.list.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Trigger error
    const fetchButton = screen.getByRole('button', { name: 'Fetch PIX List' });
    await act(async () => {
      await userEvent.click(fetchButton);
    });

    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);

    // Clear error
    const clearButton = screen.getByRole('button', { name: 'Clear Error' });
    await act(async () => {
      await userEvent.click(clearButton);
    });

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should set loading state during operations', async () => {
    const mockResponse = {
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        count: 0,
        has_more_pages: false,
      },
    };

    mockPixService.list.mockResolvedValue(mockResponse);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const fetchButton = screen.getByRole('button', { name: 'Fetch PIX List' });
    await act(async () => {
      await userEvent.click(fetchButton);
    });

    // After operation completes, loading should be false
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('should update PIX list when a new PIX is created', async () => {
    const mockResponse = {
      data: [mockPixPayment],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
        count: 1,
        has_more_pages: false,
      },
    };

    // Mock both create and list calls
    mockPixService.create.mockResolvedValue(mockPixPayment);
    mockPixService.list.mockResolvedValue(mockResponse);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: 'Create PIX' });
    await act(async () => {
      await userEvent.click(createButton);
    });

    // Should refresh list after creation
    expect(mockPixService.list).toHaveBeenCalledWith(1, undefined);
  });

  it('should handle pagination in PIX list', async () => {
    const mockResponse = {
      data: [mockPixPayment],
      meta: {
        current_page: 2,
        last_page: 3,
        per_page: 15,
        total: 45,
        count: 1,
        has_more_pages: true,
      },
    };

    mockPixService.list.mockResolvedValue(mockResponse);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const fetchButton = screen.getByRole('button', { name: 'Fetch PIX List' });
    await act(async () => {
      await userEvent.click(fetchButton);
    });

    expect(mockPixService.list).toHaveBeenCalledWith(1, undefined);
  });
});
