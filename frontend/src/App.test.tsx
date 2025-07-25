import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders router and redirects to dashboard', () => {
    render(<App />);
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/dashboard');
  });
});
