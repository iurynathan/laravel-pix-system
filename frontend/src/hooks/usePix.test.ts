import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePix } from './usePix';
import { pixService } from '@/services/pix';
import type { PixPayment, CreatePixData, PixStatistics } from '@/types/pix';

vi.mock('@/services/pix');

const mockedPixService = vi.mocked(pixService, true);

const mockPixPayment: PixPayment = {
  id: 1,
  amount: 100,
  description: 'Test PIX',
  status: 'generated',
  token: 'test-token',
  created_at: '2024-07-25T10:00:00.000Z',
  updated_at: '2024-07-25T10:00:00.000Z',
  expires_at: '2024-07-26T10:00:00.000Z',
};

describe('Hook: usePix', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should handle createPix successfully', async () => {
    const createData: CreatePixData = { amount: 100, description: 'Test' };
    mockedPixService.create.mockResolvedValue(mockPixPayment);

    const { result } = renderHook(() => usePix());

    let returnedPix: PixPayment | null = null;
    await act(async () => {
      returnedPix = await result.current.createPix(createData);
    });

    expect(mockedPixService.create).toHaveBeenCalledWith(createData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(returnedPix).toEqual(mockPixPayment);
  });

  it('should handle createPix failure', async () => {
    const createData: CreatePixData = { amount: 100, description: 'Test' };
    const errorMessage = 'Erro ao criar';
    mockedPixService.create.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePix());

    let returnedPix: PixPayment | null = null;
    await act(async () => {
      returnedPix = await result.current.createPix(createData);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(returnedPix).toBeNull();
  });

  it('should handle confirmPix successfully', async () => {
    const token = 'test-token';
    const confirmResponse = {
      success: true,
      message: 'Pago',
      status: 'paid' as const,
      pix: mockPixPayment,
    };
    mockedPixService.confirm.mockResolvedValue(confirmResponse);

    const { result } = renderHook(() => usePix());

    let response;
    await act(async () => {
      response = await result.current.confirmPix(token);
    });

    expect(mockedPixService.confirm).toHaveBeenCalledWith(token);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(response).toEqual(confirmResponse);
  });

  it('should handle getStatistics successfully', async () => {
    const stats: PixStatistics = {
      total: 10,
      paid: 5,
      generated: 5,
      expired: 0,
      total_amount: 500,
      conversion_rate: 0.5,
      total_pix: 10,
    };
    mockedPixService.statistics.mockResolvedValue(stats);

    const { result } = renderHook(() => usePix());

    let returnedStats: PixStatistics | null = null;
    await act(async () => {
      returnedStats = await result.current.getStatistics();
    });

    expect(mockedPixService.statistics).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(returnedStats).toEqual(stats);
  });

  it('should handle getQrCode successfully', async () => {
    const qrCodeString = 'qr-code-string';
    mockedPixService.qrCode.mockResolvedValue(qrCodeString);

    const { result } = renderHook(() => usePix());

    let qrCode;
    await act(async () => {
      qrCode = await result.current.getQrCode('test-token');
    });

    expect(mockedPixService.qrCode).toHaveBeenCalledWith('test-token');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(qrCode).toBe(qrCodeString);
  });

  it('should clear error', async () => {
    const errorMessage = 'Initial Error';
    mockedPixService.create.mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => usePix());

    await act(async () => {
      await result.current.createPix({ amount: 1, description: '' });
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
