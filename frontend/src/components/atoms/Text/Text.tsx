import { type ReactNode, type ElementType } from 'react';

interface TextProps {
  children: ReactNode;
  variant?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'error';
  className?: string;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClasses = {
  default: 'text-gray-900',
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  muted: 'text-gray-500',
  success: 'text-green-600',
  error: 'text-red-600',
};

export function Text({
  children,
  variant = 'p',
  size = 'base',
  weight = 'normal',
  color = 'default',
  className = '',
}: TextProps) {
  const classes = [
    sizeClasses[size],
    weightClasses[weight],
    colorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Component = variant as ElementType;

  return <Component className={classes}>{children}</Component>;
}
