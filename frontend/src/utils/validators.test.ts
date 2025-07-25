import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateRequired, validateLoginForm, validateRegisterForm } from './validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe('');
    });

    it('rejects invalid email', () => {
      expect(validateEmail('invalid-email')).toBe('Email deve ter um formato válido');
    });

    it('rejects empty email', () => {
      expect(validateEmail('')).toBe('Email é obrigatório');
    });
  });

  describe('validatePassword', () => {
    it('validates correct password', () => {
      expect(validatePassword('password123')).toBe('');
    });

    it('rejects short password', () => {
      expect(validatePassword('123')).toBe('Senha deve ter pelo menos 6 caracteres');
    });

    it('rejects empty password', () => {
      expect(validatePassword('')).toBe('Senha é obrigatória');
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty value', () => {
      expect(validateRequired('value', 'Campo')).toBe('');
    });

    it('rejects empty value', () => {
      expect(validateRequired('', 'Campo')).toBe('Campo é obrigatório');
    });
  });

  describe('validateLoginForm', () => {
    it('validates correct form', () => {
      const errors = validateLoginForm({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns errors for invalid form', () => {
      const errors = validateLoginForm({
        email: '',
        password: ''
      });
      expect(errors.email).toBe('Email é obrigatório');
      expect(errors.password).toBe('Senha é obrigatória');
    });
  });

  describe('validateRegisterForm', () => {
    it('validates correct form', () => {
      const errors = validateRegisterForm({
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns errors for password mismatch', () => {
      const errors = validateRegisterForm({
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        password_confirmation: 'different'
      });
      expect(errors.password_confirmation).toBe('Senhas não coincidem');
    });
  });
});