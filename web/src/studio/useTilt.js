import { useEffect } from 'react';
const RANGE = 9; // degrees of tilt from neutral to reach either edge of the studio
const DEAD = 1.5; // degrees around neutral that keep the picture still (hand tremor)
const RESUME = 1800; // ms after a finger drag before tilting takes over again
/**
 * Tilting the phone pans a horizontally scrollable scene (gyroscope parallax), on top of dragging with the finger.
 * Neutral (phone as it was held) shows the middle of the studio; a small tilt reaches either edge, the whole width both ways.
 * After a finger drag, neutral is re-set so tilting continues from where the finger left the picture.
 * iOS asks for motion permission on the first tap; Android needs none.
 */
export function useTilt(ref, enabled) {
    useEffect(() => {
        const el = ref.current;
        const DOE = (typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined);
        if (!el || !enabled || !DOE || !matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        let base = null, target = -1, raf = 0, touchedAt = 0, listening = false;
        const angle = (e) => {
            const a = (screen.orientation?.angle ?? 0) % 180;
            return a === 0 ? e.gamma : (screen.orientation.angle === 90 ? e.beta : -(e.beta ?? 0));
        };
        const onTilt = (e) => {
            const g = angle(e);
            const max = el.scrollWidth - el.clientWidth;
            if (g == null || max <= 0 || Date.now() - touchedAt < RESUME) {
                base = null;
                return;
            }
            // First reading: neutral is the middle of the studio (it eases there); after a drag, wherever the finger left it.
            if (base === null) {
                const p = touchedAt ? el.scrollLeft / max * 2 - 1 : 0;
                base = g - (p === 0 ? 0 : Math.sign(p) * (Math.abs(p) * RANGE + DEAD));
            }
            const d = g - base;
            const off = Math.max(-1, Math.min(1, Math.sign(d) * Math.max(0, Math.abs(d) - DEAD) / RANGE));
            target = (max / 2) * (1 + off);
            if (!raf)
                raf = requestAnimationFrame(step);
        };
        // Eased toward the target so sensor noise never jitters the picture.
        const step = () => {
            raf = 0;
            if (target < 0)
                return;
            const d = target - el.scrollLeft;
            if (Math.abs(d) < 0.5)
                return;
            el.scrollLeft += d * 0.12;
            raf = requestAnimationFrame(step);
        };
        const onTouch = () => { touchedAt = Date.now(); target = -1; base = null; };
        const listen = () => { if (!listening) {
            listening = true;
            addEventListener('deviceorientation', onTilt);
        } };
        // Chrome grants it without asking; Safari needs a tap, so the first tap anywhere on the page asks.
        const ask = () => { DOE.requestPermission().then((r) => r === 'granted' && listen()).catch(() => { }); };
        el.addEventListener('touchstart', onTouch, { passive: true });
        if (typeof DOE.requestPermission === 'function') {
            const later = () => document.addEventListener('click', ask, { once: true });
            DOE.requestPermission().then((r) => (r === 'granted' ? listen() : later())).catch(later);
        }
        else
            listen();
        return () => {
            cancelAnimationFrame(raf);
            removeEventListener('deviceorientation', onTilt);
            el.removeEventListener('touchstart', onTouch);
            document.removeEventListener('click', ask);
        };
    }, [ref, enabled]);
}
