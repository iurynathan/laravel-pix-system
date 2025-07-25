import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { validateLoginForm } from '@/utils/validators';
import type { LoginCredentials } from '@/types/auth';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateLoginForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await login(formData);
  };

  const handleInputChange =
    (field: keyof LoginCredentials) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));

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
        autoComplete="current-password"
      />

      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
        disabled={isLoading}
      >
        Entrar
      </Button>
    </form>
  );
}
