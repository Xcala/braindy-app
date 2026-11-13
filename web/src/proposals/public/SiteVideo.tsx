import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Videos live on braindy.co (same films as the site); the proposal streams them from there. */
export const SITE_MEDIA = 'https://braindy.co';
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A muted loop that loads and plays only while on screen (poster otherwise). With `sound`, a pill turns the sound on
 *  and restarts the film, like the case reel on braindy.co. Reduced motion: the poster stays until the pill is pressed. */
export function SiteVideo({ src, poster, sound, label, className, style }: {
  src: string; poster?: string; sound?: string; label?: string; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loud, setLoud] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) v.src = SITE_MEDIA + src;
        if (!reduced() || !v.muted) v.play().catch(() => undefined);
      } else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  const unmute = () => {
    const v = ref.current;
    if (!v) return;
    if (!v.src) v.src = SITE_MEDIA + src;
    v.muted = false; v.currentTime = 0; v.play().catch(() => undefined); setLoud(true);
  };
  return (
    <div className={`sv ${className ?? ''}`} style={style}>
      <video ref={ref} muted loop={!loud} playsInline preload="none" poster={poster ? SITE_MEDIA + poster : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
      {sound && !loud && <button type="button" className="sv-sound" onClick={unmute}>▶ {sound}</button>}
    </div>
  );
}
