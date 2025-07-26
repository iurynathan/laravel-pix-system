import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/templates';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { usePixContext } from '@/context/PixContext';
import { formatCurrency } from '@/utils/formatters';
import { ArrowLeft, DollarSign, FileText, CreditCard, Zap } from 'lucide-react';

export function CreatePixPage() {
  const navigate = useNavigate();
  const { createPix, loading } = usePixContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount) {
      newErrors.amount = 'Valor é obrigatório';
    } else {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Valor deve ser maior que zero';
      } else if (amount < 0.01) {
        newErrors.amount = 'Valor mínimo é R$ 0,01';
      } else if (amount > 99999.99) {
        newErrors.amount = 'Valor máximo é R$ 99.999,99';
      }
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = 'Descrição deve ter no máximo 255 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      const pixData = {
        amount,
        description: formData.description || undefined,
      };

      const newPix = await createPix(pixData);

      if (newPix) {
        navigate(`/pix/details/${newPix.id}`);
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error('Erro ao criar PIX:', error);
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    let cleanValue = value.replace(/[^\d,]/g, '');

    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      cleanValue = parts[0] + ',' + parts.slice(1).join('');
    }

    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + ',' + parts[1].slice(0, 2);
    }

    setFormData(prev => ({ ...prev, amount: cleanValue }));

    if (errors.amount && cleanValue) {
      const amount = parseFloat(cleanValue.replace(',', '.'));
      if (!isNaN(amount) && amount > 0) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const previewAmount = () => {
    if (!formData.amount) return 'R$ 0,00';

    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amount)) return 'R$ 0,00';

    return formatCurrency(amount);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-green-600"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Criar Novo PIX</h1>
              <p className="text-green-100 text-sm">
                Gere um pagamento PIX de forma rápida e segura
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Card */}
          <div>
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Dados do Pagamento
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Preencha as informações do PIX
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Amount Field */}
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Valor *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R$</span>
                      </div>
                      <input
                        type="text"
                        id="amount"
                        value={formData.amount}
                        onChange={e => handleAmountChange(e.target.value)}
                        className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          errors.amount ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0,00"
                        maxLength={10}
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Description Field */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <FileText className="inline h-4 w-4 mr-1" />
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className={`block w-full py-3 px-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.description
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder="Ex: Pagamento de serviços, produto, etc."
                      maxLength={255}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.description && (
                        <p className="text-sm text-red-600">
                          {errors.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 ml-auto">
                        {formData.description.length}/255 caracteres
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 py-3"
                      disabled={loading || !formData.amount || isSubmitting}
                    >
                      {loading || isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Criando PIX...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Criar PIX
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* Preview Card */}
          <div>
            <Card className="border-green-200">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-t-lg border-b">
                <div className="flex items-center mb-2">
                  <div className="bg-green-600 p-2 rounded-full mr-3">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Preview do PIX
                  </h3>
                </div>
                <p className="text-green-700 text-sm">
                  Como ficará seu pagamento
                </p>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {previewAmount()}
                  </div>
                  {formData.description && (
                    <p className="text-gray-600 text-sm italic">
                      "{formData.description}"
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Beneficiário:</span>
                    <span className="font-medium text-gray-900">TechPay</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Instituição:</span>
                    <span className="font-medium text-gray-900">Nubank</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">
                      PIX Instantâneo
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">
                        Informações importantes
                      </h4>
                      <div className="mt-1 text-sm text-blue-700">
                        <ul className="space-y-1">
                          <li>• O PIX será gerado após criar</li>
                          <li>• QR Code válido por 10 minutos</li>
                          <li>• Pagamento instantâneo e seguro</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
