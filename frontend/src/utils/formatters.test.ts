import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatDateFull,
  formatPixToken,
  formatCurrencyInput,
  parseCurrencyToFloat,
} from './formatters';

describe('Utils: formatters', () => {
  describe('formatCurrency', () => {
    it('should format a number into BRL currency format', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });

    it('should handle zero correctly', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50)).toBe('-R$ 50,00');
    });
  });

  describe('formatNumber', () => {
    it('should format a number with pt-BR separators', () => {
      expect(formatNumber(1234567.89)).toBe('1.234.567,89');
    });
  });

  describe('formatDate', () => {
    it('should format a date string with the default pattern', () => {
      const date = new Date('2024-07-25T10:00:00.000Z');
      expect(formatDate(date)).toMatch(/25\/07\/2024 (07:00|10:00)/);
    });

    it('should format a Date object with a custom pattern', () => {
      const date = new Date(2024, 6, 25, 10, 0, 0);
      expect(formatDate(date, 'dd/MM/yyyy')).toBe('25/07/2024');
    });

    it('should handle YYYY-MM-DD string format', () => {
      const date = '2024-07-25';
      expect(formatDate(date)).toMatch(/25\/07\/2024 (00:00|21:00)/);
    });

    it('should return "Data inválida" for an invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('Data inválida');
    });
  });

  describe('formatDateOnly', () => {
    it('should format a date to dd/MM', () => {
      const date = new Date('2024-07-25T10:00:00.000Z');
      expect(formatDateOnly(date)).toBe('25/07');
    });
  });

  describe('formatDateTime', () => {
    it('should format a date to dd/MM/yyyy HH:mm', () => {
      const date = new Date('2024-07-25T10:30:00.000Z');
      expect(formatDateTime(date)).toMatch(/25\/07\/2024 (07:30|10:30)/);
    });
  });

  describe('formatDateFull', () => {
    it('should format a date to dd/MM/yyyy', () => {
      const date = new Date('2024-07-25T10:00:00.000Z');
      expect(formatDateFull(date)).toBe('25/07/2024');
    });
  });

  describe('formatPixToken', () => {
    it('should format a token by adding spaces every 4 characters and making it uppercase', () => {
      expect(formatPixToken('abc123def456')).toBe('ABC1 23DE F456');
    });

    it('should handle tokens with length not multiple of 4', () => {
      expect(formatPixToken('abc123def45')).toBe('ABC1 23DE F45');
    });
  });

  describe('formatCurrencyInput', () => {
    it('should format a string of digits into a currency string', () => {
      expect(formatCurrencyInput('12345')).toBe('R$ 123,45');
    });

    it('should return an empty string for non-numeric input', () => {
      expect(formatCurrencyInput('abc')).toBe('');
    });

    it('should handle empty string', () => {
      expect(formatCurrencyInput('')).toBe('');
    });
  });

  describe('parseCurrencyToFloat', () => {
    it('should parse a BRL currency string to a float number', () => {
      expect(parseCurrencyToFloat('R$ 1.234,56')).toBe(1234.56);
    });

    it('should handle strings without currency symbol', () => {
      expect(parseCurrencyToFloat('1.234,56')).toBe(1234.56);
    });

    it('should handle strings with no thousands separator', () => {
      expect(parseCurrencyToFloat('R$ 1234,56')).toBe(1234.56);
    });
  });
});
