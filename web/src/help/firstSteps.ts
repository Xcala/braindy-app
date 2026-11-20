import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

// «Your first 5 steps with the assistant» (2026-11-20): each one ticks itself when the person really does it in the chat.
// Kept per person on this device; nothing is counted or scored, it only disappears once all five are done.
export const STEPS = ['ask', 'voice', 'photo', 'approve', 'site'] as const;
export type Step = (typeof STEPS)[number];
const EVENT = 'bd-learn';
const key = () => `bd-first-steps-${auth.currentUser?.uid ?? 'anon'}`;
const read = (): Step[] => { try { return JSON.parse(localStorage.getItem(key()) ?? '[]') as Step[]; } catch { return []; } };

/** Called where the thing actually happens (a question sent, a dictation, an upload, an approval, a site adjustment). */
export function markStep(step: Step) {
  const done = read();
  if (done.includes(step)) return;
  try { localStorage.setItem(key(), JSON.stringify([...done, step])); } catch { /* private mode: the list just isn't kept */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useFirstSteps() {
  const [done, setDone] = useState<Step[]>(read);
  useEffect(() => {
    const on = () => setDone(read());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return done;
}
