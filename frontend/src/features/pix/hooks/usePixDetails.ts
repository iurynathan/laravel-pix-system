import { useState, useEffect, useCallback } from 'react';
import { pixService } from '@/services';
import type { PixPayment } from '@/types/pix';

export function usePixDetails(id: string | undefined) {
  const [pix, setPix] = useState<PixPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPixDetails = useCallback(async () => {
    if (!id) {
      setError('ID do PIX não fornecido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pixData = await pixService.show(parseInt(id, 10));
      setPix(pixData);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erro ao buscar detalhes do PIX.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPixDetails();
  }, [fetchPixDetails]);

  return { pix, loading, error, refetch: fetchPixDetails };
}
