import { useEffect, useRef } from 'react';
import { publicApi } from '../api';

/**
 * Reports reading time every 15 s while the page is visible, plus the furthest section seen
 * (elements marked data-section="n"). Stops when the tab is hidden.
 */
export function usePublicTracking(token: string, sessionId: string | undefined) {
  const maxSection = useRef(0);
  const pending = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) maxSection.current = Math.max(maxSection.current, Number((e.target as HTMLElement).dataset.section ?? 0));
    }, { threshold: 0.35 });
    document.querySelectorAll('[data-section]').forEach((el) => io.observe(el));

    const tick = setInterval(() => { if (document.visibilityState === 'visible') pending.current += 1; }, 1000);
    const flush = () => {
      if (!pending.current) return;
      publicApi.ping(token, sessionId, Math.min(30, pending.current), maxSection.current);
      pending.current = 0;
    };
    const every = setInterval(flush, 15000);
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      io.disconnect(); clearInterval(tick); clearInterval(every); flush();
      document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush);
    };
  }, [token, sessionId]);
}
