import { useState, useCallback } from 'react';
import { pixService } from '@/services/pix';
import type { PixPayment } from '@/types/pix';

interface PixConfirmationResponse {
  success: boolean;
  message: string;
  status: 'paid' | 'already_paid' | 'expired' | 'not_found' | 'error';
  pix?: PixPayment;
}

interface UsePixConfirmationReturn {
  loading: boolean;
  error: string | null;
  confirmationResult: PixConfirmationResponse | null;
  confirmPix: (token: string) => Promise<void>;
  resetConfirmation: () => void;
}

export function usePixConfirmation(): UsePixConfirmationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<PixConfirmationResponse | null>(null);

  const validateToken = (token: string): string | null => {
    if (!token || token.trim().length === 0) {
      return 'Token é obrigatório';
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
    return 'Erro ao confirmar PIX';
  };

  const confirmPix = useCallback(async (token: string) => {
    // Validate token
    const validationError = validateToken(token);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setConfirmationResult(null);

    try {
      const result = await pixService.confirm(token);
      setConfirmationResult(result);

      // Set error only if the confirmation was not successful
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setConfirmationResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetConfirmation = useCallback(() => {
    setLoading(false);
    setError(null);
    setConfirmationResult(null);
  }, []);

  return {
    loading,
    error,
    confirmationResult,
    confirmPix,
    resetConfirmation,
  };
}
