import { useEffect, useState } from 'react';

/** Current time, re-rendered every `intervalMs`. Keeps countdowns and expiry labels honest. */
export function useNow(intervalMs: number = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
