import { useState, useEffect, useCallback, useRef } from 'react';
import { pixService } from '@/services/pix';
import type { PixStatistics } from '@/types/pix';
import type { PixFilters } from '@/features/dashboard/types';

interface UseDashboardReturn {
  statistics: PixStatistics | null;
  loading: boolean;
  error: string | null;
  refresh: (filters?: Partial<PixFilters>) => void;
  loadStatistics: (
    filters?: Partial<PixFilters>,
    showLoading?: boolean
  ) => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<PixStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  const loadStatistics = useCallback(
    async (
      currentFilters?: Partial<PixFilters>,
      showLoading: boolean = true
    ) => {
      try {
        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Criar novo AbortController
        abortControllerRef.current = new AbortController();

        // Só mostrar loading se for carregamento inicial E showLoading for true
        if (isInitialLoad.current && showLoading) {
          setLoading(true);
        }

        setError(null);

        const statsData = await pixService.getPixStatistics(currentFilters);

        // Verificar se a requisição não foi cancelada
        if (!abortControllerRef.current.signal.aborted) {
          setStats(statsData);
          // Sempre marcar como não inicial após primeira carga bem-sucedida
          if (isInitialLoad.current) {
            isInitialLoad.current = false;
            setLoading(false);
          }
        }
      } catch (err) {
        // Ignorar erros de cancelamento
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const message =
          err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
        setError(message);

        // Sempre parar loading em caso de erro, mesmo que seja inicial
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadStatistics();

    // Cleanup function para cancelar requisições pendentes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadStatistics]);

  const refresh = useCallback(
    (currentFilters?: Partial<PixFilters>) => {
      isInitialLoad.current = true;
      loadStatistics(currentFilters, true);
    },
    [loadStatistics]
  );

  return {
    statistics: stats,
    loading,
    error,
    refresh,
    loadStatistics,
  };
}
