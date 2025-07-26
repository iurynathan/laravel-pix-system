import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePixGeneration } from './usePixGeneration';
import { pixService } from '@/services/pix';

vi.mock('@/services/pix', () => ({
  pixService: {
    create: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

describe('usePixGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePixGeneration());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.generatedPix).toBe(null);
  });

  it('should generate PIX successfully', async () => {
    const mockPix = {
      id: 1,
      user_id: 1,
      token: 'abc123',
      amount: 100.5,
      description: 'Test PIX',
      status: 'generated' as const,
      expires_at: '2025-07-24T15:30:00Z',
      qr_code_url: 'http://localhost/qr/abc123',
      qr_code_base64: 'base64data',
      remaining_time: 900,
      is_expired: false,
      is_paid: false,
      can_be_paid: true,
      created_at: '2025-07-24T15:15:00Z',
      updated_at: '2025-07-24T15:15:00Z',
      metadata: {},
    };

    mockPixService.create.mockResolvedValue(mockPix);

    const { result } = renderHook(() => usePixGeneration());

    await act(async () => {
      await result.current.generatePix({
        amount: 100.5,
        description: 'Test PIX',
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.generatedPix).toEqual(mockPix);
    expect(mockPixService.create).toHaveBeenCalledWith({
      amount: 100.5,
      description: 'Test PIX',
    });
  });

  it('should set loading state during generation', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise<any>(resolve => {
      resolvePromise = resolve;
    });

    mockPixService.create.mockReturnValue(promise);

    const { result } = renderHook(() => usePixGeneration());

    act(() => {
      result.current.generatePix({
        amount: 50.0,
        description: 'Loading test',
      });
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      resolvePromise!({
        id: 1,
        token: 'test123',
        status: 'generated',
        amount: 50.0,
        description: 'Loading test',
        expires_at: '2025-07-24T15:30:00Z',
        created_at: '2025-07-24T15:15:00Z',
        updated_at: '2025-07-24T15:15:00Z',
        user_id: 1,
        metadata: {},
      });
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle generation errors', async () => {
    const errorMessage = 'Erro na API';
    mockPixService.create.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePixGeneration());

    await act(async () => {
      await result.current.generatePix({
        amount: 100,
        description: 'Valid data but API error',
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.generatedPix).toBe(null);
  });

  it('should clear error when generating new PIX', async () => {
    const errorMessage = 'Previous error';
    mockPixService.create.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => usePixGeneration());

    // First call fails
    await act(async () => {
      await result.current.generatePix({
        amount: 100,
        description: 'Valid data but API error',
      });
    });

    expect(result.current.error).toBe(errorMessage);

    // Second call succeeds
    const mockPix = {
      id: 2,
      token: 'success123',
      status: 'generated' as const,
      amount: 25.0,
      description: 'Success',
      expires_at: '2025-07-24T15:30:00Z',
      created_at: '2025-07-24T15:15:00Z',
      updated_at: '2025-07-24T15:15:00Z',
      user_id: 1,
      metadata: {},
    };

    mockPixService.create.mockResolvedValue(mockPix);

    await act(async () => {
      await result.current.generatePix({
        amount: 25.0,
        description: 'Success',
      });
    });

    expect(result.current.error).toBe(null);
    expect(result.current.generatedPix).toEqual(mockPix);
  });

  it('should reset state when resetGeneration is called', async () => {
    const mockPix = {
      id: 1,
      token: 'reset123',
      status: 'generated' as const,
      amount: 75.0,
      description: 'Reset test',
      expires_at: '2025-07-24T15:30:00Z',
      created_at: '2025-07-24T15:15:00Z',
      updated_at: '2025-07-24T15:15:00Z',
      user_id: 1,
      metadata: {},
    };

    mockPixService.create.mockResolvedValue(mockPix);

    const { result } = renderHook(() => usePixGeneration());

    // Generate a PIX first
    await act(async () => {
      await result.current.generatePix({
        amount: 75.0,
        description: 'Reset test',
      });
    });

    expect(result.current.generatedPix).not.toBe(null);

    // Reset the state
    act(() => {
      result.current.resetGeneration();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.generatedPix).toBe(null);
  });

  it('should validate input data before generating', async () => {
    const { result } = renderHook(() => usePixGeneration());

    await act(async () => {
      await result.current.generatePix({
        amount: -10,
        description: '',
      });
    });

    expect(result.current.error).toBe('Valor deve ser maior que zero');
    expect(result.current.generatedPix).toBe(null);
    expect(mockPixService.create).not.toHaveBeenCalled();
  });

  it('should handle API error responses correctly', async () => {
    const apiError = {
      response: {
        data: {
          success: false,
          message: 'Limite de PIX atingido',
        },
      },
    };

    mockPixService.create.mockRejectedValue(apiError);

    const { result } = renderHook(() => usePixGeneration());

    await act(async () => {
      await result.current.generatePix({
        amount: 100,
        description: 'API error test',
      });
    });

    expect(result.current.error).toBe('Limite de PIX atingido');
  });
});
