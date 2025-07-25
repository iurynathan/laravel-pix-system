import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formatar datas usando date-fns com locale pt-BR
 * @param date - Data como string (YYYY-MM-DD) ou objeto Date
 * @param formatPattern - Padrão de formatação (ex: 'dd/MM/yyyy', 'dd/MM', 'dd/MM/yyyy HH:mm')
 * @returns Data formatada
 */
export const formatDate = (
  date: string | Date,
  formatPattern: string = 'dd/MM/yyyy HH:mm'
): string => {
  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }

    return format(dateObj, formatPattern, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

// Funções de conveniência para formatos comuns
export const formatDateOnly = (date: string | Date): string => {
  return formatDate(date, 'dd/MM');
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatDateFull = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy');
};

export const formatPixToken = (token: string): string => {
  return token
    .toUpperCase()
    .replace(/(.{4})/g, '$1 ')
    .trim();
};

export function formatCurrencyInput(value: string): string {
  const onlyDigits = value.replace(/\D/g, '');

  const number = parseFloat(onlyDigits) / 100;
  if (isNaN(number)) return '';

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function parseCurrencyToFloat(formatted: string): number {
  return parseFloat(
    formatted
      .replace(/\s|R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  );
}
