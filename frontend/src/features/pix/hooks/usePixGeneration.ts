import { useState, useCallback } from 'react';
import { pixService } from '@/services/pix';
import type { PixPayment, CreatePixData } from '@/types/pix';

interface UsePixGenerationReturn {
  loading: boolean;
  error: string | null;
  generatedPix: PixPayment | null;
  generatePix: (data: CreatePixData) => Promise<void>;
  resetGeneration: () => void;
}

export function usePixGeneration(): UsePixGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPix, setGeneratedPix] = useState<PixPayment | null>(null);

  const validatePixData = (data: CreatePixData): string | null => {
    if (!data.amount || data.amount <= 0) {
      return 'Valor deve ser maior que zero';
    }
    return null;
  };

  const extractErrorMessage = (err: any): string => {
    if (err?.response?.data?.message) {
      return err.response.data.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Erro ao gerar PIX';
  };

  const generatePix = useCallback(async (data: CreatePixData) => {
    // Validate input data
    const validationError = validatePixData(data);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pix = await pixService.create(data);
      setGeneratedPix(pix);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setGeneratedPix(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetGeneration = useCallback(() => {
    setLoading(false);
    setError(null);
    setGeneratedPix(null);
  }, []);

  return {
    loading,
    error,
    generatedPix,
    generatePix,
    resetGeneration,
  };
}
