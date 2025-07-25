import { useState, useEffect } from 'react';
import { Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { pixService } from '@/services/pix';
import { formatCurrency, formatPixToken, formatDate } from '@/utils/formatters';
import type { PixPayment } from '@/types/pix';

interface QRCodeDisplayProps {
  pix: PixPayment;
}

const statusConfig = {
  generated: {
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    icon: Clock,
    label: 'Aguardando Pagamento',
  },
  paid: {
    color: 'text-green-600',
    bg: 'bg-green-100',
    icon: CheckCircle,
    label: 'Pago',
  },
  expired: {
    color: 'text-red-600',
    bg: 'bg-red-100',
    icon: XCircle,
    label: 'Expirado',
  },
};

export function QRCodeDisplay({ pix }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const statusInfo = statusConfig[pix.status];
  const StatusIcon = statusInfo.icon;

  useEffect(() => {
    const loadQRCode = async () => {
      if (pix.status !== 'generated') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const qrCode = await pixService.qrCode(pix.token);
        setQrCodeUrl(qrCode);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar QR Code';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadQRCode();
  }, [pix.token, pix.status]);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(pix.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para caso não tenha clipboard API
      console.error('Erro ao copiar token:', err);
    }
  };

  const getExpirationText = () => {
    if (pix.status === 'paid' && pix.paid_at) {
      return `Pago em ${formatDate(pix.paid_at)}`;
    }
    if (pix.status === 'expired') {
      return `Expirou em ${formatDate(pix.expires_at)}`;
    }
    return `Expira em ${formatDate(pix.expires_at)}`;
  };

  return (
    <Card>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-6">QR Code PIX</h2>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusInfo.bg} ${statusInfo.color}`}
        >
          <StatusIcon className="w-4 h-4 mr-1" />
          {statusInfo.label}
        </div>

        {/* PIX Information */}
        <div className="mb-6">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(parseFloat(pix.amount))}
          </div>
          {pix.description && (
            <div className="text-gray-600 mb-2">{pix.description}</div>
          )}
          <div className="text-sm text-gray-500">{getExpirationText()}</div>
        </div>

        {/* QR Code */}
        {pix.status === 'generated' && (
          <div className="mb-6">
            {loading && (
              <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Carregando QR Code...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-48 bg-red-50 rounded-lg">
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600">Erro ao carregar QR Code</p>
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              </div>
            )}

            {qrCodeUrl && !loading && !error && (
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={qrCodeUrl}
                  alt="QR Code para pagamento PIX"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}
          </div>
        )}

        {/* Token Display */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Token PIX:</div>
          <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono break-all">
            {formatPixToken(pix.token)}
          </div>
        </div>

        {/* Copy Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToken}
          className="w-full"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Token Copiado!' : 'Copiar Token'}
        </Button>
      </div>
    </Card>
  );
}
