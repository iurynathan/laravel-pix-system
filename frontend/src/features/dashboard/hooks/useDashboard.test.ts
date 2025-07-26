import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboard } from './useDashboard';
import { pixService } from '@/services/pix';

vi.mock('@/services/pix', () => ({
  pixService: {
    getPixStatistics: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

const mockStats = {
  generated: 15,
  paid: 8,
  expired: 3,
  total: 26,
  total_amount: 1500.75,
  conversion_rate: 30.77,
  total_pix: 26,
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load dashboard data successfully', async () => {
    mockPixService.getPixStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.statistics).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('should handle error when loading dashboard data', async () => {
    const errorMessage = 'Erro ao carregar dados';
    mockPixService.getPixStatistics.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.statistics).toBeNull();
  });

  it('should refresh dashboard data', async () => {
    mockPixService.getPixStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simula nova chamada para refresh
    const updatedStats = { ...mockStats, generated: 20 };
    mockPixService.getPixStatistics.mockResolvedValue(updatedStats);

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics).toEqual(updatedStats);
  });
});
