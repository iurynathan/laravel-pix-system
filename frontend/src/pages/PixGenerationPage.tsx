import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { AppLayout } from '@/components/templates';
import { PixGenerationForm } from '@/features/pix/components/PixGenerationForm';
import { QRCodeDisplay } from '@/features/pix/components/QRCodeDisplay';
import { usePixGeneration } from '@/features/pix/hooks';

export function PixGenerationPage() {
  const navigate = useNavigate();
  const { loading, error, generatedPix, generatePix, resetGeneration } =
    usePixGeneration();

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleGenerateNew = () => {
    resetGeneration();
  };

  if (loading) {
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
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Gerar PIX</h1>
          </div>

          <Card>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Gerando PIX...</h2>
              <p className="text-gray-600">
                Por favor, aguarde enquanto processamos sua solicitação.
              </p>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (generatedPix) {
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
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              PIX Gerado com Sucesso!
            </h1>
            <p className="text-gray-600">
              Compartilhe o QR Code ou token para receber o pagamento.
            </p>
          </div>

          <div className="space-y-6">
            <QRCodeDisplay pix={generatedPix} data-testid="qr-code-display" />

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleGenerateNew}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Gerar Novo PIX
              </Button>
            </div>
          </div>
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
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerar PIX</h1>
          <p className="text-gray-600">
            Preencha os dados abaixo para criar uma cobrança PIX. O QR Code será
            gerado automaticamente para compartilhamento.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Erro:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <PixGenerationForm
            onSuccess={_pix => {}}
            onError={_error => {}}
            onSubmit={generatePix}
            loading={loading}
            data-testid="pix-generation-form"
          />

          <Card variant="outlined" padding="lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">Como funciona?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Informe o valor e descrição do pagamento</p>
                <p>• O QR Code será gerado instantaneamente</p>
                <p>• Compartilhe com quem deve fazer o pagamento</p>
                <p>• O PIX expira em 15 minutos automaticamente</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
