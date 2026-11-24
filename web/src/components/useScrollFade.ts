import { useEffect, type RefObject } from 'react';

/**
 * A row of tabs that scrolls sideways (`.seg-scroll`) never hides its last tab silently (audit #38, lesson 01): it marks
 * `data-more="right" | "left" | "both"` so the CSS fades the edge that has more, and scrolls the active tab into view
 * whenever `key` changes. Only the row scrolls, never the page.
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft > 2;
      const right = el.scrollLeft < max - 2;
      if (left && right) el.dataset.more = 'both';
      else if (right) el.dataset.more = 'right';
      else if (left) el.dataset.more = 'left';
      else delete el.dataset.more;
    };
    const on = el.querySelector<HTMLElement>('.is-on, [aria-current="page"], [aria-selected="true"]');
    if (on) {
      const box = el.getBoundingClientRect();
      const r = on.getBoundingClientRect();
      const start = r.left - box.left + el.scrollLeft;
      const end = start + r.width;
      if (start < el.scrollLeft || end > el.scrollLeft + el.clientWidth) el.scrollLeft = Math.max(0, start - (el.clientWidth - r.width) / 2);
    }
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(el);
    return () => { el.removeEventListener('scroll', update); ro?.disconnect(); };
  }, [ref, key]);
}
