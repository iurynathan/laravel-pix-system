import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { AppLayout } from '@/components/templates';
import { PixConfirmation } from '@/features/pix/components/PixConfirmation';
import type { PixPayment } from '@/types/pix';

export function PixConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [confirmationState, setConfirmationState] = useState<{
    status: 'pending' | 'success' | 'error';
    message?: string;
    pix?: PixPayment;
  }>({ status: 'pending' });

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleSuccess = (pix: PixPayment) => {
    setConfirmationState({
      status: 'success',
      message: 'Pagamento confirmado com sucesso!',
      pix,
    });
  };

  const handleError = (error: string) => {
    setConfirmationState({
      status: 'error',
      message: error,
    });
  };

  const handleRetry = () => {
    setConfirmationState({ status: 'pending' });
  };

  // Check if token is valid
  if (!token || token.trim().length === 0) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Confirmação de Pagamento
            </h1>
          </div>

          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                Token Inválido
              </h2>
              <p className="text-gray-600 mb-6">
                O token PIX não foi fornecido ou é inválido. Verifique o link ou
                QR Code e tente novamente.
              </p>
              <Button variant="primary" onClick={handleGoBack}>
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (confirmationState.status === 'success') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Confirmação de Pagamento
            </h1>
          </div>

          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-4">
                Pagamento Confirmado com Sucesso!
              </h2>
              <p className="text-gray-600 mb-6">
                O PIX foi processado e confirmado. O pagamento foi registrado
                com sucesso.
              </p>

              {confirmationState.pix && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
                  <div className="font-medium">Detalhes do Pagamento:</div>
                  <div>
                    Valor: R${' '}
                    {parseFloat(
                      confirmationState.pix.amount.toString()
                    ).toFixed(2)}
                  </div>
                  {confirmationState.pix.description && (
                    <div>Descrição: {confirmationState.pix.description}</div>
                  )}
                  {confirmationState.pix.paid_at && (
                    <div>
                      Confirmado em:{' '}
                      {new Date(confirmationState.pix.paid_at).toLocaleString(
                        'pt-BR'
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleGoBack}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (confirmationState.status === 'error') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Confirmação de Pagamento
            </h1>
          </div>

          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                Erro na Confirmação
              </h2>
              <p className="text-gray-600 mb-4">{confirmationState.message}</p>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button variant="primary" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirmação de Pagamento
          </h1>
          <p className="text-gray-600">
            Você escaneou o QR Code ou acessou o link de pagamento. Confirme o
            pagamento PIX abaixo.
          </p>
        </div>

        <div className="space-y-6">
          <PixConfirmation
            token={token}
            onSuccess={handleSuccess}
            onError={handleError}
          />

          <Card variant="outlined" padding="lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">Como funciona?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• O pagamento será verificado automaticamente</p>
                <p>• Se válido, o PIX será marcado como pago</p>
                <p>• PIX expirados não podem ser confirmados</p>
                <p>• A confirmação é instantânea e segura</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
