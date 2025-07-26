import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders input with label', () => {
    render(
      <FormField label="Email" name="email" type="email" />
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <FormField 
        label="Email" 
        name="email" 
        type="email" 
        error="Invalid email" 
      />
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(
      <FormField 
        label="Email" 
        name="email" 
        type="email" 
        required 
      />
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays help text', () => {
    render(
      <FormField 
        label="Email" 
        name="email" 
        type="email" 
        helpText="We'll never share your email" 
      />
    );
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });
});