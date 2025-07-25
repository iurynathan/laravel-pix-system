import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QRCodeDisplay } from './QRCodeDisplay';
import { pixService } from '@/services/pix';

vi.mock('@/services/pix', () => ({
  pixService: {
    qrCode: vi.fn(),
  },
}));

const mockPixService = vi.mocked(pixService);

const mockPixData = {
  id: 1,
  user_id: 1,
  token: 'abc123def456',
  amount: '50.25',
  description: 'Teste PIX',
  status: 'generated' as const,
  expires_at: '2025-01-24T10:15:00Z',
  metadata: {},
  created_at: '2025-01-24T10:00:00Z',
  updated_at: '2025-01-24T10:00:00Z',
};

describe('QRCodeDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PIX information correctly', () => {
    render(<QRCodeDisplay pix={mockPixData} />);

    expect(screen.getByText('QR Code PIX')).toBeInTheDocument();
    expect(screen.getByText('R$ 50,25')).toBeInTheDocument();
    expect(screen.getByText('Teste PIX')).toBeInTheDocument();
    expect(screen.getByText(/expira em/i)).toBeInTheDocument();
  });

  it('loads and displays QR code on mount', async () => {
    const mockQRCode =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    mockPixService.qrCode.mockResolvedValue(mockQRCode);

    render(<QRCodeDisplay pix={mockPixData} />);

    expect(screen.getByText(/carregando qr code/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockPixService.qrCode).toHaveBeenCalledWith(mockPixData.token);
    });

    await waitFor(() => {
      const qrImage = screen.getByAltText(/qr code/i);
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', mockQRCode);
    });
  });

  it('handles QR code loading error', async () => {
    mockPixService.qrCode.mockRejectedValue(
      new Error('Erro ao carregar QR Code')
    );

    render(<QRCodeDisplay pix={mockPixData} />);

    await waitFor(() => {
      expect(screen.getAllByText(/erro ao carregar qr code/i)).toHaveLength(2);
    });
  });

  it('shows copy token button and copies to clipboard', async () => {
    // Mock clipboard API
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<QRCodeDisplay pix={mockPixData} />);

    const copyButton = screen.getByRole('button', { name: /copiar token/i });
    expect(copyButton).toBeInTheDocument();

    await userEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith(mockPixData.token);
  });

  it('shows expired status for expired PIX', () => {
    const expiredPix = {
      ...mockPixData,
      status: 'expired' as const,
    };

    render(<QRCodeDisplay pix={expiredPix} />);

    expect(screen.getByText(/expirado/i)).toBeInTheDocument();
  });

  it('shows paid status for paid PIX', () => {
    const paidPix = {
      ...mockPixData,
      status: 'paid' as const,
      paid_at: '2025-01-24T10:05:00Z',
    };

    render(<QRCodeDisplay pix={paidPix} />);

    expect(screen.getAllByText(/pago/i)).toHaveLength(2);
  });

  it('formats token display correctly', () => {
    render(<QRCodeDisplay pix={mockPixData} />);

    // Token deve ser formatado em grupos de 4 caracteres
    expect(screen.getByText(/abc1 23de f456/i)).toBeInTheDocument();
  });
});
