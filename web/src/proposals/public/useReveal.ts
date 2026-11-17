import { useEffect } from 'react';

/** Counts the number inside a stat up from 0 ("+1,150%", "55k", "200+"), keeping its prefix and suffix. */
function countUp(el: HTMLElement) {
  const text = el.dataset.count ?? '';
  const m = text.match(/^(\D*)([\d.,]+)(.*)$/);
  if (!m) return;
  const [, pre, num, post] = m;
  const sep = num.includes(',') ? ',' : num.includes('.') && num.split('.').pop()!.length === 3 ? '.' : '';
  const target = Number(num.replace(/[.,]/g, ''));
  if (!target) return;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / 1400);
    const v = Math.round(target * (1 - Math.pow(1 - t, 3)));
    el.textContent = pre + (sep ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(v)) + post;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Scroll motion for the proposal: blocks marked data-reveal rise in once, stats marked data-count count up.
 *  Reduced motion: everything shows at once, numbers stay as written. */
export function useReveal(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-count]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('is-in')); return; }
    document.documentElement.classList.add('reveal-on');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add('is-in');
        if (el.dataset.count) countUp(el);
        io.unobserve(el);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
    return () => { io.disconnect(); document.documentElement.classList.remove('reveal-on'); };
  }, [ready]);
}
