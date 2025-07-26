import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PixTimelineChart } from './PixTimelineChart';
import { pixService } from '@/services/pix';

// Mock services
vi.mock('@/services/pix');

// Mock recharts library
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => <div data-testid="legend" />,
}));

const mockedPixService = vi.mocked(pixService, true);

const mockTimelineData = [
  {
    date: '2024-07-24',
    generated: 5,
    paid: 3,
    expired: 1,
    total: 9,
    amount: 300,
  },
  {
    date: '2024-07-25',
    generated: 8,
    paid: 5,
    expired: 2,
    total: 15,
    amount: 500,
  },
];

describe('Component: PixTimelineChart', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    mockedPixService.getTimeline.mockResolvedValue(mockTimelineData);
    render(<PixTimelineChart />);
    expect(
      screen.getByTestId('pix-timeline-chart').querySelector('.animate-pulse')
    ).toBeInTheDocument();
  });

  it('should fetch timeline data and render the chart', async () => {
    mockedPixService.getTimeline.mockResolvedValue(mockTimelineData);
    render(<PixTimelineChart days={7} />);

    await waitFor(() => {
      expect(
        screen
          .queryByTestId('pix-timeline-chart')
          ?.querySelector('.animate-pulse')
      ).not.toBeInTheDocument();
    });

    expect(mockedPixService.getTimeline).toHaveBeenCalledWith(7);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(
      screen.getByText(/Evolução dos PIX nos últimos 2 dias/i)
    ).toBeInTheDocument();
  });

  it('should render summary stats correctly', async () => {
    mockedPixService.getTimeline.mockResolvedValue(mockTimelineData);
    render(<PixTimelineChart />);

    await waitFor(() => {
      expect(screen.getByText('Pagos')).toBeInTheDocument();
    });

    expect(screen.getByText(/Total: 8 | Média: 4\/dia/i)).toBeInTheDocument(); // (3+5)/2 = 4
    expect(screen.getByText(/Total: 3 | Média: 2\/dia/i)).toBeInTheDocument(); // (1+2)/2 = 1.5 -> rounded to 2
  });

  it('should display a message when no data is available', async () => {
    mockedPixService.getTimeline.mockResolvedValue([]);
    render(<PixTimelineChart />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum dado temporal disponível')
      ).toBeInTheDocument();
    });
  });

  it('should display a message on fetch error', async () => {
    mockedPixService.getTimeline.mockRejectedValue(new Error('API Error'));
    render(<PixTimelineChart />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum dado temporal disponível')
      ).toBeInTheDocument();
    });
  });
});
