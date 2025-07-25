import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardFilters } from './DashboardFilters';
import type { PixFilters } from '@/features/dashboard/types';

const mockOnFilterChange = vi.fn();
const mockOnResetFilters = vi.fn();

const initialFilters: PixFilters = {
  status: 'paid',
  search: 'test search',
  start_date: '2024-07-01',
  end_date: '2024-07-25',
  min_value: '10,00',
  max_value: '100,00',
  sort_by: 'amount',
  sort_direction: 'desc',
};

const renderComponent = (filters: PixFilters = initialFilters) => {
  return render(
    <DashboardFilters
      filters={filters}
      onFilterChange={mockOnFilterChange}
      onResetFilters={mockOnResetFilters}
    />
  );
};

describe('Component: DashboardFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all filter fields with initial values', () => {
    renderComponent();
    expect(screen.getByLabelText(/Buscar por Token ou Descrição/i)).toHaveValue(
      initialFilters.search
    );
    expect(screen.getByLabelText(/Status/i)).toHaveValue(initialFilters.status);
    expect(screen.getByLabelText(/Ordenar por/i)).toHaveValue(
      initialFilters.sort_by
    );
    expect(screen.getByLabelText(/Data Inicial/i)).toHaveValue(
      initialFilters.start_date
    );
    expect(screen.getByLabelText(/Data Final/i)).toHaveValue(
      initialFilters.end_date
    );
    expect(screen.getByLabelText(/Valor Mínimo/i)).toHaveValue(
      initialFilters.min_value
    );
    expect(screen.getByLabelText(/Valor Máximo/i)).toHaveValue(
      initialFilters.max_value
    );
    expect(screen.getByText(/Decrescente/i)).toBeInTheDocument();
  });

  it('should call onFilterChange when user types in search input', async () => {
    renderComponent();
    const searchInput = screen.getByLabelText(/Buscar por Token ou Descrição/i);
    await userEvent.type(searchInput, 'a');
    expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'test searcha' });
  });

  it('should call onFilterChange when user selects a status', async () => {
    renderComponent();
    const statusSelect = screen.getByLabelText(/Status/i);
    await userEvent.selectOptions(statusSelect, 'generated');
    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'generated' });
  });

  it('should call onFilterChange with formatted value for currency inputs', async () => {
    renderComponent();
    const minValueInput = screen.getByLabelText(/Valor Mínimo/i);
    await userEvent.type(minValueInput, '5');
    expect(mockOnFilterChange).toHaveBeenCalledWith({ min_value: '10,00' });
  });

  it('should call onResetFilters when reset button is clicked', async () => {
    renderComponent();
    const resetButton = screen.getByRole('button', {
      name: /Resetar filtros/i,
    });
    await userEvent.click(resetButton);
    expect(mockOnResetFilters).toHaveBeenCalledTimes(1);
  });

  it('should toggle sort direction when sort button is clicked', async () => {
    renderComponent({ ...initialFilters, sort_direction: 'asc' });
    const sortButton = screen.getByRole('button', { name: /Inverter ordem/i });

    expect(screen.getByText(/Crescente/i)).toBeInTheDocument();

    await userEvent.click(sortButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith({ sort_direction: 'desc' });
  });
});
