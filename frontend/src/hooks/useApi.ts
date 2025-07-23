import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApi = <T = unknown>() => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await apiCall();
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro na requisição';
      setState(prev => ({ ...prev, error, loading: false }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearError,
  };
};