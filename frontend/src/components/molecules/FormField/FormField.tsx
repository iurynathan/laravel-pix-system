import React from 'react';
import { Input } from '@/components/atoms/Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helpText,
  icon,
  ...props
}) => {
  return (
    <Input
      label={
        required ? (
          <>
            {label} <span className="text-red-500">*</span>
          </>
        ) : (
          label
        )
      }
      error={error}
      helpText={helpText}
      icon={icon}
      {...props}
    />
  );
};
