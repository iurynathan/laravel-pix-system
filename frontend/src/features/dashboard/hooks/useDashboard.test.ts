import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboard } from './useDashboard';
import { pixService } from '@/services/pix';

vi.mock('@/services/pix', () => ({
  pixService: {
    getPixStatistics: vi.fn(),
    list: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

const mockStats = {
  generated: 15,
  paid: 8,
  expired: 3,
  total: 26,
  total_amount: 1500.75,
};

const mockPixListResponse = {
  data: [
    {
      id: 1,
      token: 'abc123',
      amount: 100.5,
      status: 'generated',
      created_at: '2025-01-24T10:00:00Z',
      expires_at: '2025-01-24T10:15:00Z',
      updated_at: '2025-01-24T10:00:00Z',
    },
    {
      id: 2,
      token: 'def456',
      amount: 50.25,
      status: 'paid',
      created_at: '2025-01-24T09:00:00Z',
      updated_at: '2025-01-24T09:05:00Z',
      paid_at: '2025-01-24T09:05:00Z',
    },
  ],
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load dashboard data successfully', async () => {
    mockPixService.getPixStatistics.mockResolvedValue(mockStats);
    mockPixService.list.mockResolvedValue(mockPixListResponse);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.statistics).toBeNull();
    expect(result.current.pixList).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics).toEqual(mockStats);
    expect(result.current.pixList).toEqual(mockPixListResponse.data);
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
    mockPixService.list.mockResolvedValue(mockPixListResponse);

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
