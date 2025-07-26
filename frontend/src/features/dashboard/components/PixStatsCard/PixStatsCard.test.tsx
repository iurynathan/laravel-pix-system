import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PixStatsCard } from './PixStatsCard';

describe('PixStatsCard', () => {
  it('renders card with title, value and icon', () => {
    render(
      <PixStatsCard
        title="PIX Gerados"
        value={15}
        icon="generated"
        color="blue"
      />
    );

    expect(screen.getByText('PIX Gerados')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders different colors correctly', () => {
    const { rerender } = render(
      <PixStatsCard title="PIX Pagos" value={8} icon="paid" color="green" />
    );

    expect(screen.getByTestId('stats-card')).toHaveClass('border-green-200');

    rerender(
      <PixStatsCard
        title="PIX Expirados"
        value={3}
        icon="expired"
        color="red"
      />
    );

    expect(screen.getByTestId('stats-card')).toHaveClass('border-red-200');
  });

  it('renders zero value correctly', () => {
    render(
      <PixStatsCard
        title="PIX Pendentes"
        value={0}
        icon="generated"
        color="yellow"
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders large numbers with formatting', () => {
    render(
      <PixStatsCard
        title="Total PIX"
        value={1250}
        icon="generated"
        color="blue"
      />
    );

    expect(screen.getByText('1.250')).toBeInTheDocument();
  });
});
