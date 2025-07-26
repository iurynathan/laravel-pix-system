import { api } from './api';
import type { PixPayment, CreatePixData, PixStatistics } from '@/types/pix';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { PixFilters } from '@/features/dashboard/types';

const NUMERIC_KEYS = ['min_value', 'max_value'];

export const pixService = {
  create: async (data: CreatePixData): Promise<PixPayment> => {
    const response = await api.post<ApiResponse<PixPayment>>('/pix', data);
    return response.data.data;
  },

  list: async (
    filters: Partial<PixFilters> & { page?: number }
  ): Promise<PaginatedResponse<PixPayment>> => {
    const params = new URLSearchParams();

    const numericValues: Record<string, number> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        let processedValue = String(value);

        if (NUMERIC_KEYS.includes(key)) {
          processedValue = processedValue.replace(',', '.');

          const numeric = Number(processedValue);
          if (!isNaN(numeric)) {
            numericValues[key] = numeric;
          }
        }

        (filters[key as keyof typeof filters] as string) = processedValue;
      }
    });

    if (
      numericValues.min_value !== undefined &&
      numericValues.max_value !== undefined &&
      numericValues.max_value < numericValues.min_value
    ) {
      delete filters.max_value;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        params.append(key, String(value));
      }
    });

    const response = await api.get<ApiResponse<PaginatedResponse<PixPayment>>>(
      `/pix?${params.toString()}`
    );
    return response.data.data;
  },

  show: async (id: number): Promise<PixPayment> => {
    const response = await api.get<ApiResponse<PixPayment>>(`/pix/${id}`);
    return response.data.data;
  },

  confirm: async (
    token: string
  ): Promise<{
    success: boolean;
    message: string;
    status: 'paid' | 'already_paid' | 'expired' | 'not_found' | 'error';
    pix?: PixPayment;
  }> => {
    const response = await api.post(`/pix/confirm/${token}`);
    return response.data;
  },

  statistics: async (filters?: Partial<PixFilters>): Promise<PixStatistics> => {
    const params = new URLSearchParams();

    if (filters) {
      const numericValues: Record<string, number> = {};

      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ''
        ) {
          let processedValue = String(value);

          if (NUMERIC_KEYS.includes(key)) {
            processedValue = processedValue.replace(',', '.');

            const numeric = Number(processedValue);
            if (!isNaN(numeric)) {
              numericValues[key] = numeric;
            }
          }

          (filters[key as keyof typeof filters] as string) = processedValue;
        }
      });

      if (
        numericValues.min_value !== undefined &&
        numericValues.max_value !== undefined &&
        numericValues.max_value < numericValues.min_value
      ) {
        delete filters.max_value;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ''
        ) {
          params.append(key, String(value));
        }
      });
    }

    const url = params.toString()
      ? `/pix/statistics?${params.toString()}`
      : '/pix/statistics';
    const response = await api.get<ApiResponse<PixStatistics>>(url);
    return response.data.data;
  },

  getPixStatistics: async (
    filters?: Partial<PixFilters>
  ): Promise<PixStatistics> => {
    return pixService.statistics(filters);
  },

  qrCode: async (token: string): Promise<string> => {
    const response = await api.get<ApiResponse<{ qr_code: string }>>(
      `/pix/qrcode/${token}`
    );
    return response.data.data.qr_code;
  },

  getTimeline: async (
    days = 30
  ): Promise<
    Array<{
      date: string;
      generated: number;
      paid: number;
      expired: number;
      total: number;
      amount: number;
    }>
  > => {
    const response = await api.get<
      ApiResponse<
        Array<{
          date: string;
          generated: number;
          paid: number;
          expired: number;
          total: number;
          amount: number;
        }>
      >
    >(`/pix/timeline?days=${days}`);
    return response.data.data;
  },
};
