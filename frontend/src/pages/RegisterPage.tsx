import { RegisterForm } from '@/features/auth';
import { AuthLayout } from '@/components/templates';

export function RegisterPage() {
  return (
    <AuthLayout title="Criar nova conta">
      <RegisterForm />
    </AuthLayout>
  );
}
