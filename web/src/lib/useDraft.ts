import { useState } from 'react';

const load = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };

/**
 * Text being written that survives a reload, an app update or a closed tab (Ana, 2026-11-20: 20 minutes of comments
 * lost on a refresh). Kept in this browser under `key` on every keystroke, until it is sent (set it back to '').
 */
export function useDraft(key: string) {
  const k = `draft:${key}`;
  const [s, setS] = useState(() => ({ k, text: load(k) }));
  // Another request (another key) brings its own draft.
  if (s.k !== k) setS({ k, text: load(k) });
  const text = s.k === k ? s.text : load(k);
  const setText = (v: string) => {
    setS({ k, text: v });
    try { if (v.trim()) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* storage blocked */ }
  };
  return [text, setText] as const;
}
