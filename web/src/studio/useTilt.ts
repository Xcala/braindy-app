import { useEffect, type RefObject } from 'react';

type Orientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
const RANGE = 22; // degrees of tilt from where the phone was held to reach either side of the studio
const RESUME = 1800; // ms after a finger drag before tilting takes over again

/**
 * Tilting the phone pans a horizontally scrollable scene (gyroscope parallax), on top of dragging with the finger.
 * Neutral is however the phone was held when tilting starts (and again after each drag), so it works lying down or upright.
 * iOS asks for motion permission on the first tap; Android needs none.
 */
export function useTilt(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    const DOE = (typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined) as Orientation | undefined;
    if (!el || !enabled || !DOE || !matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let base: number | null = null, from = 0, target = -1, raf = 0, touchedAt = 0, listening = false;
    const angle = (e: DeviceOrientationEvent) => {
      const a = (screen.orientation?.angle ?? 0) % 180;
      return a === 0 ? e.gamma : (screen.orientation.angle === 90 ? e.beta : -(e.beta ?? 0));
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      const g = angle(e);
      const max = el.scrollWidth - el.clientWidth;
      if (g == null || max <= 0 || Date.now() - touchedAt < RESUME) { base = null; return; }
      if (base === null) { base = g; from = el.scrollLeft; }
      const off = Math.max(-1, Math.min(1, (g - base) / RANGE));
      target = Math.max(0, Math.min(max, from + off * (max / 2)));
      if (!raf) raf = requestAnimationFrame(step);
    };
    // Eased toward the target so sensor noise never jitters the picture.
    const step = () => {
      raf = 0;
      if (target < 0) return;
      const d = target - el.scrollLeft;
      if (Math.abs(d) < 0.5) return;
      el.scrollLeft += d * 0.12;
      raf = requestAnimationFrame(step);
    };
    const onTouch = () => { touchedAt = Date.now(); target = -1; base = null; };
    const listen = () => { if (!listening) { listening = true; addEventListener('deviceorientation', onTilt); } };
    // Chrome grants it without asking; Safari needs a tap, so the first tap anywhere on the page asks.
    const ask = () => { DOE.requestPermission!().then((r) => r === 'granted' && listen()).catch(() => {}); };

    el.addEventListener('touchstart', onTouch, { passive: true });
    if (typeof DOE.requestPermission === 'function') {
      const later = () => document.addEventListener('click', ask, { once: true });
      DOE.requestPermission().then((r) => (r === 'granted' ? listen() : later())).catch(later);
    } else listen();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('deviceorientation', onTilt);
      el.removeEventListener('touchstart', onTouch);
      document.removeEventListener('click', ask);
    };
  }, [ref, enabled]);
}
