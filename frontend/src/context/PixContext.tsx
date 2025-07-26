import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import toast from 'react-hot-toast';
import { pixService } from '@/services/pix';
import type { PixPayment, CreatePixData, PixStatistics } from '@/types/pix';
import type { PaginatedResponse } from '@/types/api';
import type { PixFilters } from '@/features/dashboard/types';

interface PixState {
  pixList: PixPayment[];
  loading: boolean;
  error: string | null;
  statistics: PixStatistics | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  } | null;
  filters: PixFilters;
}

type PixAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PIX_LIST'; payload: PaginatedResponse<PixPayment> }
  | { type: 'SET_STATISTICS'; payload: PixStatistics }
  | { type: 'ADD_PIX'; payload: PixPayment }
  | { type: 'UPDATE_PIX'; payload: PixPayment }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_FILTERS'; payload: Partial<PixFilters> };

interface PixContextType extends PixState {
  fetchPixList: (page?: number) => Promise<void>;
  updateFilters: (newFilters: Partial<PixFilters>) => void;
  createPix: (data: CreatePixData) => Promise<PixPayment | null>;
  confirmPix: (token: string) => Promise<any>;
  fetchStatistics: () => Promise<void>;
  clearError: () => void;
  refreshPixList: () => Promise<void>;
}

const initialState: PixState = {
  pixList: [],
  loading: false,
  error: null,
  statistics: null,
  pagination: null,
  filters: {
    status: '',
    search: '',
    start_date: '',
    end_date: '',
    min_value: '',
    max_value: '',
    sort_by: 'created_at',
    sort_direction: 'desc',
  },
};

function pixReducer(state: PixState, action: PixAction): PixState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'SET_PIX_LIST':
      return {
        ...state,
        pixList: action.payload.data,
        pagination: {
          currentPage: action.payload.meta.current_page,
          lastPage: action.payload.meta.last_page,
          perPage: action.payload.meta.per_page,
          total: action.payload.meta.total,
        },
        loading: false,
        error: null,
      };

    case 'SET_STATISTICS':
      return {
        ...state,
        statistics: action.payload,
        loading: false,
        error: null,
      };

    case 'ADD_PIX':
      return {
        ...state,
        pixList: [action.payload, ...state.pixList],
        loading: false,
        error: null,
      };

    case 'UPDATE_PIX':
      return {
        ...state,
        pixList: state.pixList.map(pix =>
          pix.id === action.payload.id ? { ...pix, ...action.payload } : pix
        ),
        loading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

const PixContext = createContext<PixContextType | undefined>(undefined);

export function PixProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pixReducer, initialState);

  const extractErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Erro inesperado';
  };

  const fetchPixList = useCallback(
    async (page = 1) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await pixService.list({ ...state.filters, page });
        dispatch({
          type: 'SET_PIX_LIST',
          payload: response,
        });
      } catch (error) {
        const errorMessage = extractErrorMessage(error);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    },
    [state.filters]
  );

  const updateFilters = useCallback((newFilters: Partial<PixFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  }, []);

  const createPix = useCallback(
    async (data: CreatePixData): Promise<PixPayment | null> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const newPix = await pixService.create(data);
        dispatch({ type: 'ADD_PIX', payload: newPix });

        await fetchPixList(1);

        toast.success('PIX criado com sucesso!', {
          duration: 4000,
          icon: '✅',
        });

        return newPix;
      } catch (error) {
        const errorMessage = extractErrorMessage(error);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });

        toast.error(`Erro ao criar PIX: ${errorMessage}`, {
          duration: 5000,
          icon: '❌',
        });

        return null;
      }
    },
    [fetchPixList]
  );

  const confirmPix = useCallback(async (token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await pixService.confirm(token);

      if (result.success && result.pix) {
        dispatch({ type: 'UPDATE_PIX', payload: result.pix });

        // Toast de sucesso
        toast.success('PIX confirmado com sucesso!', {
          duration: 4000,
          icon: '💚',
        });
      } else if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.message });

        if (result.status === 'expired') {
          toast.error('PIX expirado', {
            duration: 4000,
            icon: '⏰',
          });
        } else if (result.status === 'already_paid') {
          toast('PIX já foi pago anteriormente', {
            duration: 4000,
            icon: 'ℹ️',
          });
        } else {
          toast.error(result.message, {
            duration: 5000,
            icon: '❌',
          });
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      return result;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      toast.error(`Erro ao confirmar PIX: ${errorMessage}`, {
        duration: 5000,
        icon: '❌',
      });

      throw error;
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const stats = await pixService.statistics();
      dispatch({ type: 'SET_STATISTICS', payload: stats });
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const refreshPixList = useCallback(async () => {
    if (state.pagination) {
      await fetchPixList(state.pagination.currentPage);
    } else {
      await fetchPixList(1);
    }
  }, [fetchPixList, state.pagination]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: PixContextType = {
    ...state,
    fetchPixList,
    updateFilters,
    createPix,
    confirmPix,
    fetchStatistics,
    clearError,
    refreshPixList,
  };

  return (
    <PixContext.Provider value={contextValue}>{children}</PixContext.Provider>
  );
}

export function usePixContext(): PixContextType {
  const context = useContext(PixContext);
  if (context === undefined) {
    throw new Error('usePixContext deve ser usado dentro de um PixProvider');
  }
  return context;
}
