import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePixDetails } from './usePixDetails';
import { pixService } from '@/services';
import type { PixPayment } from '@/types/pix';

vi.mock('@/services');

const mockedPixService = vi.mocked(pixService, true);

const mockPixPayment: PixPayment = {
  id: 1,
  amount: 150.75,
  description: 'Detailed PIX',
  status: 'paid',
  token: 'detail-token-123',
  created_at: '2024-07-25T11:00:00.000Z',
  updated_at: '2024-07-25T11:05:00.000Z',
  expires_at: '2024-07-26T11:00:00.000Z',
  paid_at: '2024-07-25T11:05:00.000Z',
};

describe('Hook: usePixDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and set pix details on mount', async () => {
    mockedPixService.show.mockResolvedValue(mockPixPayment);
    const { result } = renderHook(() => usePixDetails('1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedPixService.show).toHaveBeenCalledWith(1);
    expect(result.current.pix).toEqual(mockPixPayment);
    expect(result.current.error).toBeNull();
  });

  it('should set error state on fetch failure', async () => {
    const errorMessage = 'PIX não encontrado';
    mockedPixService.show.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });
    const { result } = renderHook(() => usePixDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pix).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should not fetch if id is undefined', async () => {
    const { result } = renderHook(() => usePixDetails(undefined));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('ID do PIX não fornecido.');
    expect(mockedPixService.show).not.toHaveBeenCalled();
  });

  it('should refetch data when refetch is called', async () => {
    mockedPixService.show.mockResolvedValueOnce(mockPixPayment);
    const { result } = renderHook(() => usePixDetails('1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pix).toEqual(mockPixPayment);

    const updatedPix = { ...mockPixPayment, status: 'expired' as const };
    mockedPixService.show.mockResolvedValueOnce(updatedPix);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockedPixService.show).toHaveBeenCalledTimes(2);
    expect(result.current.pix).toEqual(updatedPix);
  });
});
