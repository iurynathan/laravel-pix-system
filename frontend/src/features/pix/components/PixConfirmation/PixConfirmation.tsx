import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { pixService } from '@/services/pix';
import { formatPixToken } from '@/utils/formatters';
import type { PixPayment } from '@/types/pix';

interface PixConfirmationResponse {
  success: boolean;
  message: string;
  status: 'paid' | 'already_paid' | 'expired' | 'not_found' | 'error';
  pix?: PixPayment;
}

interface PixConfirmationProps {
  token: string;
  onSuccess?: (pix: PixPayment) => void;
  onError?: (error: string) => void;
}

export function PixConfirmation({
  token,
  onSuccess,
  onError,
}: PixConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PixConfirmationResponse | null>(
    null
  );
  const [initialLoad, setInitialLoad] = useState(true);

  const isValidToken = token && token.trim().length > 0;

  useEffect(() => {
    if (isValidToken && initialLoad) {
      handleConfirm();
      setInitialLoad(false);
    }
  }, [token, initialLoad]);

  const handleConfirm = async () => {
    if (!isValidToken) {
      onError?.('Token inválido');
      return;
    }

    setLoading(true);

    try {
      const result = await pixService.confirm(token);
      setResponse(result);

      if (result.success && result.pix) {
        onSuccess?.(result.pix);
      } else {
        onError?.(result.message);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao confirmar pagamento';
      setResponse({
        success: false,
        message,
        status: 'error',
      });
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <Card>
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Token Inválido</h2>
          <p className="text-gray-600">
            O token PIX fornecido não é válido. Verifique o QR Code ou link.
          </p>
        </div>
      </Card>
    );
  }

  if (response) {
    const { success, message, status, pix } = response;
    const isPaid = status === 'paid' || status === 'already_paid';
    const isExpired = status === 'expired';
    const isNotFound = status === 'not_found';
    const isError = status === 'error';

    return (
      <Card data-testid="pix-confirmation-result">
        <div className="text-center">
          {isPaid && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-600 mb-4">
                {status === 'already_paid'
                  ? 'PIX Já Pago'
                  : 'Pagamento Confirmado!'}
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
            </>
          )}

          {isExpired && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                PIX Expirado
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
            </>
          )}

          {(isNotFound || isError) && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                {isNotFound ? 'PIX Não Encontrado' : 'Erro na Confirmação'}
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
            </>
          )}

          {pix && (
            <div className="bg-gray-100 p-3 rounded-lg text-sm mt-4">
              <div className="font-medium">
                Token: {formatPixToken(pix.token)}
              </div>
              <div>
                Valor: R$ {parseFloat(pix.amount.toString()).toFixed(2)}
              </div>
              {pix.description && <div>Descrição: {pix.description}</div>}
              {pix.paid_at && (
                <div>
                  Pago em: {new Date(pix.paid_at).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          )}

          {!success && !isNotFound && (
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              loading={loading}
              disabled={loading}
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card data-testid="pix-confirmation-pending">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">
          Confirmação de Pagamento PIX
        </h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Você está prestes a confirmar o pagamento do PIX com token:
          </p>
          <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
            {formatPixToken(token)}
          </div>
        </div>

        <div className="mb-6 text-sm text-gray-600 space-y-2">
          <p>• O pagamento será verificado automaticamente</p>
          <p>• Após a confirmação, o PIX será marcado como pago</p>
          <p>• Se o PIX estiver expirado, será exibida uma mensagem de erro</p>
        </div>

        {loading && (
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Verificando PIX...</p>
          </div>
        )}

        {!loading && !initialLoad && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full"
          >
            Verificar Novamente
          </Button>
        )}
      </div>
    </Card>
  );
}
