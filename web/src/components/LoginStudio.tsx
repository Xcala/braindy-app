import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sfTime = () => new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

/** The San Francisco studio at work, shown on the sign-in stage: the photo, its loop and the live SF time. */
export function LoginStudio() {
  const { t } = useI18n();
  const [time, setTime] = useState(sfTime);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { const id = setInterval(() => setTime(sfTime()), 20000); return () => clearInterval(id); }, []);
  return (
    <figure className="relative m-0 overflow-hidden rounded-[16px]" style={{ aspectRatio: '2752 / 1536', background: '#000', boxShadow: '0 18px 50px #0007', border: '1px solid #ffffff1f' }}>
      <img src="/studio/studio.jpg" alt={t('login.studioAlt')} className="absolute inset-0 h-full w-full object-cover" />
      {!reduce && <video src="/studio/loop.mp4" autoPlay muted loop playsInline aria-hidden="true" onPlaying={() => setPlaying(true)}
        className="absolute inset-0 h-full w-full object-cover" style={{ opacity: playing ? 1 : 0, transition: 'opacity .6s' }} />}
      <figcaption className="absolute left-3 top-3 flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: '#0B1022CC', backdropFilter: 'blur(8px)' }}>
        <i className="live-dot" aria-hidden="true" />{t('login.studioLive')} · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
      </figcaption>
    </figure>
  );
}
