import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePixConfirmation } from './usePixConfirmation';
import { pixService } from '@/services/pix';

vi.mock('@/services/pix', () => ({
  pixService: {
    confirm: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

describe('usePixConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePixConfirmation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.confirmationResult).toBe(null);
  });

  it('should confirm PIX successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Pagamento confirmado com sucesso!',
      status: 'paid' as const,
      pix: {
        id: 1,
        user_id: 1,
        token: 'abc123',
        amount: 100.5,
        description: 'Test PIX',
        status: 'paid' as const,
        expires_at: '2025-07-24T15:30:00Z',
        paid_at: '2025-07-24T15:25:00Z',
        created_at: '2025-07-24T15:15:00Z',
        updated_at: '2025-07-24T15:25:00Z',
        metadata: {},
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('abc123');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.confirmationResult).toEqual(mockResponse);
    expect(mockPixService.confirm).toHaveBeenCalledWith('abc123');
  });

  it('should handle expired PIX', async () => {
    const mockResponse = {
      success: false,
      message: 'PIX expirado',
      status: 'expired' as const,
      pix: {
        id: 1,
        user_id: 1,
        token: 'expired123',
        amount: 50.0,
        description: 'Expired PIX',
        status: 'expired' as const,
        expires_at: '2025-07-24T15:00:00Z',
        created_at: '2025-07-24T14:45:00Z',
        updated_at: '2025-07-24T15:00:00Z',
        metadata: {},
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('expired123');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('PIX expirado');
    expect(result.current.confirmationResult).toEqual(mockResponse);
  });

  it('should handle PIX not found', async () => {
    const mockResponse = {
      success: false,
      message: 'PIX não encontrado',
      status: 'not_found' as const,
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('notfound123');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('PIX não encontrado');
    expect(result.current.confirmationResult).toEqual(mockResponse);
  });

  it('should handle already paid PIX', async () => {
    const mockResponse = {
      success: true,
      message: 'PIX já foi pago anteriormente',
      status: 'already_paid' as const,
      pix: {
        id: 1,
        user_id: 1,
        token: 'paid123',
        amount: 75.0,
        description: 'Already paid',
        status: 'paid' as const,
        expires_at: '2025-07-24T15:30:00Z',
        paid_at: '2025-07-24T15:20:00Z',
        created_at: '2025-07-24T15:15:00Z',
        updated_at: '2025-07-24T15:20:00Z',
        metadata: {},
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('paid123');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.confirmationResult).toEqual(mockResponse);
  });

  it('should set loading state during confirmation', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockPixService.confirm.mockReturnValue(promise);

    const { result } = renderHook(() => usePixConfirmation());

    act(() => {
      result.current.confirmPix('loading123');
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      resolvePromise!({
        success: true,
        message: 'Success',
        status: 'paid',
        pix: {
          id: 1,
          token: 'loading123',
          status: 'paid',
          amount: 25.0,
          description: 'Loading test',
          expires_at: '2025-07-24T15:30:00Z',
          created_at: '2025-07-24T15:15:00Z',
          updated_at: '2025-07-24T15:25:00Z',
          user_id: 1,
          metadata: {},
        },
      });
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle network errors', async () => {
    const errorMessage = 'Network error';
    mockPixService.confirm.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('error123');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.confirmationResult).toBe(null);
  });

  it('should validate token before confirming', async () => {
    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('');
    });

    expect(result.current.error).toBe('Token é obrigatório');
    expect(result.current.confirmationResult).toBe(null);
    expect(mockPixService.confirm).not.toHaveBeenCalled();
  });

  it('should clear error on new confirmation attempt', async () => {
    const errorMessage = 'Previous error';
    mockPixService.confirm.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => usePixConfirmation());

    // First call fails
    await act(async () => {
      await result.current.confirmPix('error123');
    });

    expect(result.current.error).toBe(errorMessage);

    // Second call succeeds
    const mockResponse = {
      success: true,
      message: 'Success',
      status: 'paid' as const,
      pix: {
        id: 2,
        token: 'success123',
        status: 'paid' as const,
        amount: 30.0,
        description: 'Success',
        expires_at: '2025-07-24T15:30:00Z',
        created_at: '2025-07-24T15:15:00Z',
        updated_at: '2025-07-24T15:25:00Z',
        user_id: 1,
        metadata: {},
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    await act(async () => {
      await result.current.confirmPix('success123');
    });

    expect(result.current.error).toBe(null);
    expect(result.current.confirmationResult).toEqual(mockResponse);
  });

  it('should reset state when resetConfirmation is called', async () => {
    const mockResponse = {
      success: true,
      message: 'Reset test',
      status: 'paid' as const,
      pix: {
        id: 1,
        token: 'reset123',
        status: 'paid' as const,
        amount: 40.0,
        description: 'Reset test',
        expires_at: '2025-07-24T15:30:00Z',
        created_at: '2025-07-24T15:15:00Z',
        updated_at: '2025-07-24T15:25:00Z',
        user_id: 1,
        metadata: {},
      },
    };

    mockPixService.confirm.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePixConfirmation());

    // Confirm a PIX first
    await act(async () => {
      await result.current.confirmPix('reset123');
    });

    expect(result.current.confirmationResult).toEqual(mockResponse);

    // Reset the state
    act(() => {
      result.current.resetConfirmation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.confirmationResult).toBe(null);
  });

  it('should handle API error responses correctly', async () => {
    const apiError = {
      response: {
        data: {
          success: false,
          message: 'Token inválido ou expirado',
        },
      },
    };

    mockPixService.confirm.mockRejectedValue(apiError);

    const { result } = renderHook(() => usePixConfirmation());

    await act(async () => {
      await result.current.confirmPix('invalid123');
    });

    expect(result.current.error).toBe('Token inválido ou expirado');
  });
});
