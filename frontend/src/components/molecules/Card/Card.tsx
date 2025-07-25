import { type ReactNode, type MouseEvent, type ComponentProps } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps extends Omit<ComponentProps<'div'>, 'onClick'> {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

const variantClasses = {
  default: 'border border-gray-200 bg-white',
  outlined: 'border-2 border-gray-300 bg-transparent',
  elevated: 'shadow-lg border-0 bg-white',
};

const paddingClasses = {
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  title,
  icon,
  footer,
  variant = 'default',
  padding = 'md',
  loading = false,
  onClick,
  className = '',
  ...props
}: CardProps) {
  const isClickable = Boolean(onClick);

  const classes = cn(
    'rounded-lg',
    variantClasses[variant],
    paddingClasses[padding],
    isClickable && 'cursor-pointer hover:shadow-md',
    className
  );

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(event);
    }
  };

  if (loading) {
    return (
      <div className={classes}>
        <div className="text-center py-4">
          <span className="text-gray-500">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={classes} onClick={handleClick} {...props}>
      {(title || icon) && (
        <div className="flex items-center mb-4">
          {icon && <div className="mr-2">{icon}</div>}
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
        </div>
      )}

      {children}

      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>
      )}
    </div>
  );
}
