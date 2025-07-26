import { useState } from 'react';
import { LoginForm } from '../LoginForm';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '@/hooks/useAuth';

export function AuthForm() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { isLoading } = useAuth();

  return (
    <div className="space-y-6">
      {isRegisterMode ? <RegisterForm /> : <LoginForm />}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsRegisterMode(!isRegisterMode)}
          className="text-sm text-blue-600 hover:text-blue-500 underline"
          disabled={isLoading}
        >
          {isRegisterMode
            ? 'Já tem conta? Entre'
            : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}
