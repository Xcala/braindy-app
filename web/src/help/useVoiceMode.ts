import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = 'bd-help-voice';
/** What is said out loud: the answer without links, markdown or emoji. */
const speakable = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, '').replace(/\p{Extended_Pictographic}/gu, '')
  .replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();

export const canVoice = () => typeof window !== 'undefined' && 'speechSynthesis' in window
  && !!((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

/**
 * Hands-free: each new answer is read out loud and, when it ends, the message box listens again and sends what the
 * person says (event «bd-help-listen», handled by the Composer). Remembered per device; off when the panel closes.
 */
export function useVoiceMode(lang: string, lastAnswer: { key: string; text: string } | null, open: boolean) {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  // The answer already on screen when the panel opens is not read again.
  const said = useRef<string | null>(lastAnswer?.key ?? null);
  const listen = () => window.dispatchEvent(new Event('bd-help-listen'));
  const toggle = useCallback(() => setOn((v) => {
    const next = !v;
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* private mode */ }
    if (!next) window.speechSynthesis?.cancel();
    else window.setTimeout(listen, 50);
    return next;
  }), []);
  useEffect(() => { if (!open) window.speechSynthesis?.cancel(); }, [open]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    if (!lastAnswer || said.current === lastAnswer.key) return;
    said.current = lastAnswer.key;
    if (!on || !open) return;
    const u = new SpeechSynthesisUtterance(speakable(lastAnswer.text).slice(0, 1200));
    u.lang = lang === 'es' ? 'es-CO' : 'en-US';
    u.rate = 1.05;
    u.onend = listen;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [on, open, lastAnswer, lang]);
  return { on, toggle };
}
