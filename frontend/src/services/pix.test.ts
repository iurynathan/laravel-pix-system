import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pixService } from './pix';
import { api } from './api';
import type { PixPayment, CreatePixData, PixStatistics } from '@/types/pix';
import type { PaginatedResponse } from '@/types/api';

vi.mock('./api');

const mockedApi = vi.mocked(api, true);

const mockPixPayment: PixPayment = {
  id: 1,
  amount: 100,
  description: 'Test PIX',
  status: 'generated',
  token: 'test-token',
  created_at: '2024-07-25T10:00:00.000Z',
  updated_at: '2024-07-25T10:00:00.000Z',
  expires_at: '2024-07-26T10:00:00.000Z',
};

describe('Service: pixService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a pix payment', async () => {
    const createData: CreatePixData = { amount: 100, description: 'Test' };
    mockedApi.post.mockResolvedValue({ data: { data: mockPixPayment } });

    const result = await pixService.create(createData);

    expect(mockedApi.post).toHaveBeenCalledWith('/pix', createData);
    expect(result).toEqual(mockPixPayment);
  });

  it('should list pix payments with filters', async () => {
    const paginatedResponse: PaginatedResponse<PixPayment> = {
      data: [mockPixPayment],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
        count: 1,
        has_more_pages: false,
      },
    };
    mockedApi.get.mockResolvedValue({ data: { data: paginatedResponse } });

    const filters = {
      status: 'paid' as const,
      min_value: '10,50',
      max_value: '100,00',
      page: 1,
    };
    await pixService.list(filters);

    const expectedParams = new URLSearchParams({
      status: 'paid',
      min_value: '10.50',
      max_value: '100.00',
      page: '1',
    }).toString();
    expect(mockedApi.get).toHaveBeenCalledWith(`/pix?${expectedParams}`);
  });

  it('should handle invalid range in list filters', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: {} } });
    const filters = { min_value: '100,00', max_value: '50,00' };
    await pixService.list(filters);

    const expectedParams = new URLSearchParams({
      min_value: '100.00',
    }).toString();
    expect(mockedApi.get).toHaveBeenCalledWith(`/pix?${expectedParams}`);
  });

  it('should show a pix payment', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: mockPixPayment } });
    const result = await pixService.show(1);
    expect(mockedApi.get).toHaveBeenCalledWith('/pix/1');
    expect(result).toEqual(mockPixPayment);
  });

  it('should confirm a pix payment', async () => {
    const confirmResponse = {
      success: true,
      message: 'Pago',
      status: 'paid' as const,
      pix: mockPixPayment,
    };
    mockedApi.post.mockResolvedValue({ data: confirmResponse });
    const result = await pixService.confirm('test-token');
    expect(mockedApi.post).toHaveBeenCalledWith('/pix/confirm/test-token');
    expect(result).toEqual(confirmResponse);
  });

  it('should get statistics', async () => {
    const stats: PixStatistics = {
      total: 10,
      paid: 5,
      generated: 5,
      expired: 0,
      total_amount: 500,
      conversion_rate: 0.5,
      total_pix: 10,
    };
    mockedApi.get.mockResolvedValue({ data: { data: stats } });
    const result = await pixService.statistics();
    expect(mockedApi.get).toHaveBeenCalledWith('/pix/statistics');
    expect(result).toEqual(stats);
  });

  it('should get qr code', async () => {
    const qrCodeResponse = { qr_code: 'qr-code-string' };
    mockedApi.get.mockResolvedValue({ data: { data: qrCodeResponse } });
    const result = await pixService.qrCode('test-token');
    expect(mockedApi.get).toHaveBeenCalledWith('/pix/qrcode/test-token');
    expect(result).toBe('qr-code-string');
  });

  it('should get timeline', async () => {
    const timelineData = [
      {
        date: '2024-07-25',
        generated: 1,
        paid: 1,
        expired: 0,
        total: 1,
        amount: 100,
      },
    ];
    mockedApi.get.mockResolvedValue({ data: { data: timelineData } });
    const result = await pixService.getTimeline(7);
    expect(mockedApi.get).toHaveBeenCalledWith('/pix/timeline?days=7');
    expect(result).toEqual(timelineData);
  });
});
