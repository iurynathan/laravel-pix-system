import { LoginForm } from '@/features/auth';
import { AuthLayout } from '@/components/templates';

export function LoginPage() {
  return (
    <AuthLayout title="Entrar na sua conta">
      <LoginForm />
    </AuthLayout>
  );
}
