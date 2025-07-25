import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should throw an error when used outside of AuthProvider', () => {
    const originalError = console.error;
    console.error = () => {};

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser usado dentro de um AuthProvider'
    );

    console.error = originalError;
  });
});
