import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import { PixProvider } from '@/context/PixContext';
import { AuthProvider } from '@/context/AuthContext';

// Mock do useDashboard
vi.mock('@/features/dashboard/hooks/useDashboard', () => {
  return {
    useDashboard: vi.fn(),
  };
});
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
const mockUseDashboard = useDashboard as Mock;

// Mock do useDebounce (para não atrasar testes)
vi.mock('use-debounce', () => ({
  useDebounce: <T,>(v: T) => [v],
}));

// Mock do AppLayout para simplificar render
vi.mock('@/components/templates/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

// Mock do AuthProvider para garantir autenticação
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@pix.com' },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

// Mock dos componentes visuais para simplificar snapshot
vi.mock('@/features/dashboard/components', () => ({
  DashboardFilters: ({
    onFilterChange,
    onResetFilters,
  }: {
    onFilterChange: (filters: unknown) => void;
    onResetFilters: () => void;
  }) => (
    <div>
      <button onClick={() => onFilterChange({ search: 'pix' })}>Filter</button>
      <button onClick={onResetFilters}>Clear</button>
    </div>
  ),
  PixStatsCard: ({ title, value }: { title: string; value: number }) => (
    <div data-testid="stats-card">
      {title}: {value}
    </div>
  ),
  PixChartRecharts: () => <div data-testid="pix-chart-recharts">Chart</div>,
  PixTimelineChart: () => <div data-testid="pix-timeline-chart">Timeline</div>,
  PixVirtualList: ({
    pixList,
    onPageChange,
  }: {
    pixList: Array<{ id: number; token: string }>;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="pix-list">
      {pixList.map(pix => (
        <div key={pix.id}>{pix.token}</div>
      ))}
      <button onClick={() => onPageChange(2)}>Next Page</button>
    </div>
  ),
}));

// Mock do contexto PixProvider
const mockPixContext = {
  pixList: [
    {
      id: 1,
      token: 'abc123',
      amount: 100,
      status: 'generated',
      created_at: '2025-07-24T15:15:00Z',
    },
    {
      id: 2,
      token: 'def456',
      amount: 200,
      status: 'paid',
      created_at: '2025-07-24T15:16:00Z',
    },
  ],
  loading: false,
  pagination: { currentPage: 1, lastPage: 2, perPage: 15, total: 2 },
  filters: {
    status: '',
    search: '',
    start_date: '',
    end_date: '',
    min_value: '',
    max_value: '',
    sort_by: 'created_at',
    sort_direction: 'desc',
  },
  fetchPixList: vi.fn(),
  updateFilters: vi.fn(),
  refreshPixList: vi.fn(),
};

vi.mock('@/context', () => ({
  usePixContext: () => mockPixContext,
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <PixProvider>{ui}</PixProvider>
    </AuthProvider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading when statsLoading is true', () => {
    mockUseDashboard.mockReturnValue({
      statistics: null,
      loading: true,
      error: null,
      loadStatistics: vi.fn(),
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Carregando dashboard/i)).toBeInTheDocument();
  });

  it('should show error when statsError is set', () => {
    mockUseDashboard.mockReturnValue({
      statistics: null,
      loading: false,
      error: 'Load error',
      loadStatistics: vi.fn(),
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Erro ao carregar dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Load error')).toBeInTheDocument();
  });

  it('should render cards, filters, charts and PIX list', () => {
    mockUseDashboard.mockReturnValue({
      statistics: {
        generated: 1,
        paid: 1,
        expired: 0,
        total: 2,
        total_amount: 300,
        conversion_rate: 50,
        total_pix: 2,
      },
      loading: false,
      error: null,
      loadStatistics: vi.fn(),
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    const statsCards = screen.getAllByTestId('stats-card');
    expect(statsCards.length).toBe(4);
    expect(screen.getByTestId('pix-chart-recharts')).toBeInTheDocument();
    expect(screen.getByTestId('pix-timeline-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pix-list')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(screen.getByText('def456')).toBeInTheDocument();
  });

  it('should call updateFilters when clicking Filter', async () => {
    mockUseDashboard.mockReturnValue({
      statistics: null,
      loading: false,
      error: null,
      loadStatistics: vi.fn(),
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    const filterBtn = screen.getByText('Filter');
    await userEvent.click(filterBtn);
    expect(mockPixContext.updateFilters).toHaveBeenCalledWith({
      search: 'pix',
    });
  });

  it('should call updateFilters when clicking Clear', async () => {
    mockUseDashboard.mockReturnValue({
      statistics: null,
      loading: false,
      error: null,
      loadStatistics: vi.fn(),
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    const clearBtn = screen.getByText('Clear');
    await userEvent.click(clearBtn);
    expect(mockPixContext.updateFilters).toHaveBeenCalledWith({
      status: '',
      search: '',
      start_date: '',
      end_date: '',
      min_value: '',
      max_value: '',
      sort_by: 'created_at',
      sort_direction: 'desc',
    });
  });

  it('should call fetchPixList when changing page', async () => {
    mockUseDashboard.mockReturnValue({
      statistics: null,
      loading: false,
      error: null,
      loadStatistics: vi.fn(),
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    const nextPageBtn = screen.getByText('Next Page');
    await userEvent.click(nextPageBtn);
    expect(mockPixContext.fetchPixList).toHaveBeenCalledWith(2);
  });

  it('should call refreshPixList and loadStatistics when clicking Update', async () => {
    const mockLoadStatistics = vi.fn();
    mockUseDashboard.mockReturnValue({
      statistics: null,
      loading: false,
      error: null,
      loadStatistics: mockLoadStatistics,
      refresh: vi.fn(),
    });
    renderWithProviders(<DashboardPage />);
    const updateBtn = screen.getByText('Atualizar');
    await userEvent.click(updateBtn);
    expect(mockPixContext.refreshPixList).toHaveBeenCalled();
    expect(mockLoadStatistics).toHaveBeenCalled();
  });
});
