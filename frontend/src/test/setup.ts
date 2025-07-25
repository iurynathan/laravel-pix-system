import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => React.createElement('a', { href: to, ...props }, children),
    Navigate: ({ to }: { to: string }) =>
      React.createElement('div', { 'data-testid': 'navigate-to' }, to),
  };
});
