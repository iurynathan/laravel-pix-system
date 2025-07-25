import { api } from './api';
import type { PixPayment, CreatePixData, PixStatistics } from '@/types/pix';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export const pixService = {
  create: async (data: CreatePixData): Promise<PixPayment> => {
    const response = await api.post<ApiResponse<PixPayment>>('/pix', data);
    return response.data.data;
  },

  list: async (
    page = 1,
    status?: string
  ): Promise<PaginatedResponse<PixPayment>> => {
    const params = new URLSearchParams({ page: page.toString() });
    if (status) params.append('status', status);

    const response = await api.get<ApiResponse<PaginatedResponse<PixPayment>>>(
      `/pix?${params}`
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

  statistics: async (): Promise<PixStatistics> => {
    const response =
      await api.get<ApiResponse<PixStatistics>>('/pix/statistics');
    return response.data.data;
  },

  getPixStatistics: async (): Promise<PixStatistics> => {
    const response =
      await api.get<ApiResponse<PixStatistics>>('/pix/statistics');
    return response.data.data;
  },

  qrCode: async (token: string): Promise<string> => {
    const response = await api.get<ApiResponse<{ qr_code: string }>>(
      `/pix/qrcode/${token}`
    );
    return response.data.data.qr_code;
  },
};
