import { useState } from 'react';
import { Button, Input } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { pixService } from '@/services/pix';
import type { PixPayment, CreatePixData } from '@/types/pix';
import { formatCurrencyInput, parseCurrencyToFloat } from '@/utils/formatters';

interface PixGenerationFormProps {
  onSuccess: (pix: PixPayment) => void;
  onError: (error: string) => void;
  onSubmit?: (data: CreatePixData) => Promise<void>;
  loading?: boolean;
}

interface FormData {
  amount: string;
  description: string;
}

interface FormErrors {
  amount?: string;
  description?: string;
}

export function PixGenerationForm({
  onSuccess,
  onError,
}: PixGenerationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Valor é obrigatório';
    } else {
      const amount = parseCurrencyToFloat(formData.amount);
      if (isNaN(amount) || amount < 0.01) {
        newErrors.amount = 'Valor mínimo é R$ 0,01';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const createData: CreatePixData = {
        amount: parseCurrencyToFloat(formData.amount),
        description: formData.description.trim() || undefined,
      };

      const pix = await pixService.create(createData);
      onSuccess(pix);

      setFormData({ amount: '', description: '' });
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao gerar PIX';
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (field === 'amount') {
        value = formatCurrencyInput(value);
      }

      setFormData(prev => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">Gerar PIX</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Valor (R$)"
          placeholder="R$ 0,00"
          value={formData.amount}
          onChange={handleChange('amount')}
          disabled={loading}
          error={errors.amount}
        />

        <Input
          label="Descrição (opcional)"
          type="text"
          placeholder="Digite uma descrição para o PIX"
          value={formData.description}
          onChange={handleChange('description')}
          disabled={loading}
          error={errors.description}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Gerando...' : 'Gerar PIX'}
        </Button>
      </form>
    </Card>
  );
}
