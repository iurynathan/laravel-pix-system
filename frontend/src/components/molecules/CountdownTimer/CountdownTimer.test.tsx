import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CountdownTimer } from './CountdownTimer';

describe('Component: CountdownTimer', () => {
  const baseTime = new Date(2024, 6, 25, 10, 0, 0).getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display the time left correctly', () => {
    const futureDate = new Date(baseTime + 1000 * 65).toISOString(); // 1 minute and 5 seconds
    const onExpire = vi.fn();

    render(<CountdownTimer expiryDate={futureDate} onExpire={onExpire} />);

    expect(screen.getByText(/Expira em:/i)).toBeInTheDocument();
    expect(screen.getByText(/1 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/5 seconds/i)).toBeInTheDocument();
  });

  it('should call onExpire when the timer reaches zero', () => {
    const futureDate = new Date(baseTime + 2000).toISOString(); // 2 seconds from now
    const onExpire = vi.fn();

    render(<CountdownTimer expiryDate={futureDate} onExpire={onExpire} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/1 seconds/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Expirado/i)).toBeInTheDocument();
  });
});
