export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
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
