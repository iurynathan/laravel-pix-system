import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { validateRegisterForm } from '@/utils/validators';
import type { RegisterData } from '@/types/auth';

export function RegisterForm() {
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateRegisterForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await register(formData);
  };

  const handleInputChange =
    (field: keyof RegisterData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <FormField
        label="Nome"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleInputChange('name')}
        error={errors.name}
        autoComplete="name"
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleInputChange('email')}
        error={errors.email}
        autoComplete="email"
      />

      <FormField
        label="Senha"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleInputChange('password')}
        error={errors.password}
        autoComplete="new-password"
      />

      <FormField
        label="Confirmar Senha"
        name="password_confirmation"
        type="password"
        value={formData.password_confirmation}
        onChange={handleInputChange('password_confirmation')}
        error={errors.password_confirmation}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
        disabled={isLoading}
      >
        Cadastrar
      </Button>
    </form>
  );
}
