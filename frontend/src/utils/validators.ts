import type { LoginCredentials, RegisterData } from '@/types/auth';

export const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return 'Email é obrigatório';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email deve ter um formato válido';
  }

  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) {
    return 'Senha é obrigatória';
  }

  if (password.length < 6) {
    return 'Senha deve ter pelo menos 6 caracteres';
  }

  return '';
};

export const validateRequired = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} é obrigatório`;
  }

  return '';
};

export const validateLoginForm = (
  data: LoginCredentials
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
};

export const validateRegisterForm = (
  data: RegisterData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const nameError = validateRequired(data.name, 'Nome');
  if (nameError) {
    errors.name = nameError;
  }

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (data.password !== data.password_confirmation) {
    errors.password_confirmation = 'Senhas não coincidem';
  }

  return errors;
};
