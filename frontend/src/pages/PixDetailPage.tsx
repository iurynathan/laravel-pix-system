import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/templates';
import { usePixDetails } from '@/features/pix/hooks/usePixDetails';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Button } from '@/components/atoms';
import { Card, CountdownTimer } from '@/components/molecules';
import { pixService } from '@/services/pix';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Clock,
  Hash,
  Type,
  Info,
  Building,
  Zap,
  Shield,
  Copy,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const statusConfig = {
  generated: {
    label: 'Aguardando Pagamento',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: Clock,
    description: 'PIX gerado e aguardando confirmação do pagamento',
  },
  paid: {
    label: 'Pago',
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: CheckCircle,
    description: 'Pagamento confirmado com sucesso',
  },
  expired: {
    label: 'Expirado',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: XCircle,
    description: 'PIX expirou sem pagamento',
  },
} as const;

export function PixDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { pix, loading, error, refetch } = usePixDetails(id);
  const [copied, setCopied] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const qrCodeUrl = pix
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/pix/qrcode/${pix.token}`
    : '';

  const handleCopyPixCode = async () => {
    if (!pix) return;

    try {
      // Criar um texto com informações do PIX
      const pixCode = `PIX - ${pix.company?.trade_name || 'TechPay'}
Valor: R$ ${pix.amount.toFixed(2).replace('.', ',')}
${pix.description ? `Descrição: ${pix.description}` : ''}
Token: ${pix.token}

Para pagar, acesse: ${qrCodeUrl}`;

      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast.success('Código PIX copiado!', {
        duration: 2000,
        icon: '📋',
      });
    } catch (err) {
      console.error('Erro ao copiar:', err);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = pix.token;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast.success('Código PIX copiado!', {
        duration: 2000,
        icon: '📋',
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!pix || confirmingPayment) return;

    setConfirmingPayment(true);

    try {
      const result = await pixService.confirm(pix.token);

      if (result.success) {
        await refetch();
        toast.success('Pagamento confirmado com sucesso!', {
          duration: 4000,
          icon: '✅',
        });
      } else {
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
          toast.error(`Erro ao confirmar pagamento: ${result.message}`, {
            duration: 5000,
            icon: '❌',
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento. Tente novamente.', {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const renderDetailItem = (
    Icon: React.ElementType,
    label: string,
    value: React.ReactNode
  ) => (
    <div className="flex items-start space-x-4">
      <div className="bg-gray-100 p-2 rounded-full">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-md font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando detalhes do PIX...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="bg-red-50 border-red-200">
            <div className="p-4 text-center">
              <h3 className="text-red-800 font-medium">Erro ao carregar PIX</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Link to="/dashboard">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!pix) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-gray-500">PIX não encontrado.</p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Dashboard
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const showQrCode =
    pix.status === 'generated' &&
    !pix.paid_at &&
    new Date(pix.expires_at) > new Date();

  const currentStatus = statusConfig[pix?.status as keyof typeof statusConfig];
  const StatusIcon = currentStatus?.icon || Clock;

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Detalhes do PIX</h1>
                <p className="text-blue-100 text-sm">
                  {pix
                    ? `ID: ${pix.id} • ${formatDate(pix.created_at)}`
                    : 'Carregando...'}
                </p>
              </div>
            </div>
            {pix && (
              <div className="flex space-x-3">
                <StatusIcon className="h-6 w-6" />
                <div className="text-right">
                  <div className="font-semibold">{currentStatus?.label}</div>
                  <div className="text-sm text-blue-100">
                    {formatCurrency(pix.amount)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Alert */}
        {pix && (
          <div
            className={`border-l-4 p-4 rounded-r-lg ${currentStatus?.color}`}
          >
            <div className="flex items-center">
              <StatusIcon className="h-5 w-5 mr-3" />
              <div>
                <h3 className="font-semibold">{currentStatus?.label}</h3>
                <p className="text-sm opacity-90">
                  {currentStatus?.description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Code Card - First on mobile, Second on desktop */}
          {showQrCode && (
            <div className="lg:col-span-1 order-1 lg:order-2">
              {/* PIX Payment Card */}
              <Card className="border-blue-200 shadow-lg">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-blue-600 p-2 rounded-full mr-3">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-blue-900">
                      Pagamento PIX
                    </h2>
                  </div>
                  <p className="text-center text-blue-700 text-sm">
                    Instantâneo • Seguro • 24h/7dias
                  </p>
                </div>

                <div className="p-6">
                  {/* QR Code Section - Moved to top */}
                  <div className="text-center mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-inner border-2 border-gray-100 inline-block">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code PIX"
                        className="w-56 h-56 rounded-lg"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center text-green-600">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        QR Code Validado
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  {pix.status === 'generated' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center text-amber-800">
                        <Clock className="h-5 w-5 mr-2" />
                        <span className="font-medium">Expira em:</span>
                      </div>
                      <div className="text-center mt-2">
                        <CountdownTimer
                          expiryDate={pix.expires_at}
                          onExpire={refetch}
                        />
                      </div>
                    </div>
                  )}

                  {/* Beneficiary Info */}
                  {pix.company && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center mb-3">
                        <Building className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">
                          Beneficiário
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Empresa:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {pix.company.trade_name}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">CNPJ:</span>
                          <span className="text-sm font-mono text-gray-900">
                            {pix.company.cnpj_masked}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Banco:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {pix.company.institution.short_name}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Chave PIX:
                          </span>
                          <span className="text-sm font-mono text-gray-900">
                            {pix.company.pix_key.value}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Local:</span>
                          <span className="text-sm text-gray-900">
                            {pix.company.address.city}/
                            {pix.company.address.state}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">
                          Como pagar:
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Abra o app do seu banco</li>
                          <li>• Acesse a área PIX</li>
                          <li>• Escaneie o QR Code acima</li>
                          <li>• Confirme o pagamento</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleCopyPixCode}
                      className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Código Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Código PIX
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <Shield className="h-4 w-4 mr-2" />
                      <span>
                        Pagamento protegido pelo Banco Central do Brasil
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Transaction Summary - Second on mobile, First on desktop */}
          <div
            className={`${showQrCode ? 'lg:col-span-2 order-2 lg:order-1' : 'lg:col-span-3'}`}
          >
            {/* Transaction Summary */}
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Resumo da Transação
                  </h2>
                  <div className="flex items-center space-x-3">
                    {pix && (
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full border ${currentStatus?.color}`}
                      >
                        {currentStatus?.label}
                      </span>
                    )}
                    {/* Admin Confirm Button - Only for admins and generated status */}
                    {pix && pix.status === 'generated' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50 cursor-pointer"
                        onClick={handleConfirmPayment}
                        disabled={confirmingPayment}
                      >
                        {confirmingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-1"></div>
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Confirmar Pagamento
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(pix.amount)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(pix.created_at)}
                    </div>
                  </div>
                  {pix.description && (
                    <p className="text-gray-600 mt-2">{pix.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 border-b pb-2">
                      Detalhes do Pagamento
                    </h3>
                    {renderDetailItem(Hash, 'ID da Transação', pix.id)}
                    {renderDetailItem(Type, 'Token PIX', pix.token)}
                    {pix.status !== 'paid' &&
                      renderDetailItem(
                        Clock,
                        'Expira em',
                        formatDate(pix.expires_at)
                      )}
                    {pix.paid_at &&
                      renderDetailItem(
                        CheckCircle,
                        'Confirmado em',
                        formatDate(pix.paid_at)
                      )}
                  </div>

                  {pix.user && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 border-b pb-2">
                        Solicitante
                      </h3>
                      {renderDetailItem(User, 'Nome', pix.user.name)}
                      {renderDetailItem(Info, 'Email', pix.user.email)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
