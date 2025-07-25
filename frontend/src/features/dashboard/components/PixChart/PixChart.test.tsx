import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PixChart } from './PixChart';
import type { PixStatistics } from '@/types/pix';

const mockData: PixStatistics = {
  generated: 15,
  paid: 8,
  expired: 3,
  total: 26,
  total_amount: 1000.5,
};

describe('PixChart', () => {
  it('renders chart with title and data', () => {
    render(<PixChart data={mockData} title="Estatísticas PIX" />);

    expect(screen.getByText('Estatísticas PIX')).toBeInTheDocument();
    expect(screen.getByTestId('pix-chart')).toBeInTheDocument();
  });

  it('renders chart bars with correct proportions', () => {
    render(<PixChart data={mockData} title="PIX Status" />);

    const bars = screen.getAllByTestId(/^chart-bar-/);
    expect(bars).toHaveLength(3);

    // Verifica se as barras estão presentes
    expect(screen.getByTestId('chart-bar-generated')).toBeInTheDocument();
    expect(screen.getByTestId('chart-bar-paid')).toBeInTheDocument();
    expect(screen.getByTestId('chart-bar-expired')).toBeInTheDocument();
  });

  it('renders legend with status labels and counts', () => {
    render(<PixChart data={mockData} title="PIX Chart" />);

    expect(screen.getByText('Gerados: 15')).toBeInTheDocument();
    expect(screen.getByText('Pagos: 8')).toBeInTheDocument();
    expect(screen.getByText('Expirados: 3')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<PixChart data={null} title="Sem dados" />);

    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument();
  });

  it('calculates total correctly', () => {
    render(<PixChart data={mockData} title="Total Chart" />);

    expect(screen.getByText('Total: 26')).toBeInTheDocument();
  });
});
