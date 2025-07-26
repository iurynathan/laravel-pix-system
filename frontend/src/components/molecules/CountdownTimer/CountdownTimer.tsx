import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiryDate: string;
  onExpire: () => void;
}

export function CountdownTimer({ expiryDate, onExpire }: CountdownTimerProps) {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiryDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.keys(newTimeLeft).length === 0) {
        onExpire();
      }
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: React.ReactNode[] = [];

  Object.keys(timeLeft).forEach(interval => {
    if (!(timeLeft as any)[interval]) {
      return;
    }

    timerComponents.push(
      <span key={interval}>
        {(timeLeft as any)[interval]} {interval}{' '}
      </span>
    );
  });

  return (
    <div className="text-sm font-medium text-red-600">
      <span>Expira em: </span>
      {timerComponents.length ? timerComponents : <span>Expirado!</span>}
    </div>
  );
}
