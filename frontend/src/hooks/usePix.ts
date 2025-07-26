import { useState, useCallback } from 'react';
import { pixService } from '@/services/pix';
import type { PixPayment, CreatePixData, PixStatistics } from '@/types/pix';

export const usePix = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPix = useCallback(
    async (data: CreatePixData): Promise<PixPayment | null> => {
      try {
        setLoading(true);
        setError(null);
        const pix = await pixService.create(data);
        return pix;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar PIX');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmPix = useCallback(
    async (
      token: string
    ): Promise<{
      success: boolean;
      message: string;
      status: 'paid' | 'already_paid' | 'expired' | 'not_found' | 'error';
      pix?: PixPayment;
    } | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await pixService.confirm(token);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao confirmar PIX');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getStatistics = useCallback(async (): Promise<PixStatistics | null> => {
    try {
      setLoading(true);
      setError(null);
      const stats = await pixService.statistics();
      return stats;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar estatísticas'
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getQrCode = useCallback(
    async (token: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        const qrCode = await pixService.qrCode(token);
        return qrCode;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createPix,
    confirmPix,
    getStatistics,
    getQrCode,
    clearError,
  };
};
