import { useState, useEffect, useCallback } from 'react';
import { pixService } from '@/services/pix';
import type { PixStatistics, PixPayment } from '@/types/pix';

interface UseDashboardReturn {
  statistics: PixStatistics | null;
  pixList: PixPayment[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<PixStatistics | null>(null);
  const [pixList, setPixList] = useState<PixPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, pixListResponse] = await Promise.all([
        pixService.getPixStatistics(),
        pixService.list(1), // Primeira página
      ]);

      setStats(statsData);
      setPixList(pixListResponse.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    statistics: stats,
    pixList,
    loading,
    error,
    refresh,
  };
}
