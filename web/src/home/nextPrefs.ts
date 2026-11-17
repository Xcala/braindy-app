import { useEffect, useState } from 'react';

/** How each person wants the «Next meeting» card on Home: small or full, at the top or in its place, or closed. Kept in this browser. */
export type NextPrefs = { small: boolean; top: boolean; closedFor: string | null };
const KEY = 'bd-home-next';
const EVENT = 'bd-home-next';
const DEFAULT: NextPrefs = { small: false, top: false, closedFor: null };

function read(): NextPrefs {
  try { return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<NextPrefs>) }; } catch { return DEFAULT; }
}

export function useNextPrefs() {
  const [p, setP] = useState<NextPrefs>(read);
  useEffect(() => {
    const sync = () => setP(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const set = (patch: Partial<NextPrefs>) => {
    const next = { ...read(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* not kept, still applied */ }
    setP(next);
    window.dispatchEvent(new Event(EVENT)); // the other copy of the card (top or in place) follows
  };
  return [p, set] as const;
}
