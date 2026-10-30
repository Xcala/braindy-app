import { useEffect, useRef, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { WorkItem } from '../team/useWork';
import { CLOSEUP, SEAT_ORDER, SEATS, pct, zoomTo, type SeatId } from './geometry';
import { FocusCard, SEAT_NAME } from './FocusCard';
import type { SeatView } from './useStudio';
import { isSimulated, officeState, outfit, studioNow } from './officeHours';
import { internalWork } from './internalWork';
import './studio.css';

const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const locale = (lang: string) => (lang === 'es' ? 'es-CO' : 'en-US');
const fmtTime = (tz: string) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(studioNow());
const fmtDate = (tz: string, lang: string) => new Intl.DateTimeFormat(locale(lang), { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })
  .format(studioNow()).replace(/\.| de/g, '').replace(',', '');

/** Wall clock times and dates, and whether NicoMarca is in the office, refreshed every 20 s. */
function useClock(lang: string) {
  const read = () => ({
    sf: fmtTime('America/Los_Angeles'), bog: fmtTime('America/Bogota'),
    sfDate: fmtDate('America/Los_Angeles', lang), bogDate: fmtDate('America/Bogota', lang), office: officeState(),
  });
  const [now, setNow] = useState(read);
  useEffect(() => { setNow(read()); const id = setInterval(() => setNow(read()), 20000); return () => clearInterval(id); }, [lang]);
  return now;
}

/** The studio photo with its live layer: loop video, glowing screens, bubbles, wall clock and zoom into each seat. */
export function Scene({ seats, items, toSignCount, brandView = false }: { seats: Record<SeatId, SeatView>; items: WorkItem[]; toSignCount: number; brandView?: boolean }) {
  const { t, lang } = useI18n();
  const { brands } = useBrands();
  const brand = (id?: string) => brands.find((b) => b.id === id)?.name ?? '';
  const sceneRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLVideoElement>(null);
  const [focused, setFocused] = useState<SeatId | null>(null);
  const [transform, setTransform] = useState('');
  const [closeOn, setCloseOn] = useState(false);
  const [loopOn, setLoopOn] = useState(false);
  const clock = useClock(lang);
  const [look] = useState(outfit);
  // The Brains work 24/7; NicoMarca only in office hours, so outside them his seat reads "out of the office".
  const office = clock.office;
  const away = office.open ? undefined : {
    back: t('st.back7', { when: office.days === 0 ? t('st.today') : office.days === 1 ? t('st.tomorrow')
      : t('st.onDay', { day: new Intl.DateTimeFormat(locale(lang), { weekday: 'long', timeZone: 'UTC' }).format(office.back) }) }),
    holiday: office.holiday,
  };
  // Nobody is ever idle: without client work, a seat works on Braindy or Revista Level.
  const shown = (id: SeatId) => (id === 'nico' && away ? 'away' : seats[id].state === 'free' ? 'working' : seats[id].state);
  const idle = (id: SeatId) => internalWork(id, lang, studioNow());
  const loopRef = useRef<HTMLVideoElement>(null);
  const [seen, setSeen] = useState(false);

  // The 3 MB loop loads only once the scene scrolls into view, and pauses whenever it leaves it.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || reduce || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); loopRef.current?.play?.().catch(() => {}); } else loopRef.current?.pause();
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // A client sees their own brand only: NicoMarca reviews (never "waiting for your signature"), idle seats read as ready.
  const stateKey = (st: SeatView['state'] | 'away') => `st.state.${brandView ? (st === 'toSign' ? 'reviewing' : st === 'free' ? 'ready' : st) : st}` as StringKey;

  useEffect(() => {
    if (!focused) return;
    const place = () => { const el = sceneRef.current; if (el) setTransform(zoomTo(focused, el.clientWidth, el.clientHeight)); };
    place();
    setCloseOn(false);
    const v = closeRef.current;
    let timer = 0;
    if (v && !reduce && !(focused === 'nico' && !officeState().open)) { v.src = `/studio/${CLOSEUP[focused]}${focused === 'nico' ? look : ''}.mp4`; v.play?.().catch(() => {}); timer = window.setTimeout(() => setCloseOn(true), 800); }
    addEventListener('resize', place);
    return () => { clearTimeout(timer); removeEventListener('resize', place); };
  }, [focused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') zoomOut(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  function zoomOut() {
    setCloseOn(false);
    setTimeout(() => { setFocused(null); setTransform(''); closeRef.current?.pause(); }, 350);
  }

  return (
    <div className="sd-scroll">
      <div ref={sceneRef} className={`sd-scene ${focused ? 'zoomed' : ''} ${away ? 'nico-away' : ''}`} onClick={(e) => { if (focused && !(e.target as HTMLElement).closest('.sd-focus')) zoomOut(); }}>
        <div className="sd-cam" style={{ transform }}>
          <img src={`/studio/studio${look}.jpg`} alt={t('st.title')} loading="lazy" />
          {!reduce && seen && <video ref={loopRef} className={loopOn ? 'on' : ''} src={`/studio/loop${look}.mp4`} autoPlay muted loop playsInline aria-hidden="true" onPlaying={() => setLoopOn(true)} />}
          {SEAT_ORDER.map((id) => {
            const s = SEATS[id], st = shown(id);
            return (
              <div key={id}>
                <button type="button" className="sd-hot" aria-label={`${SEAT_NAME[id]}: ${t(stateKey(st))}`} onClick={() => setFocused(id)}
                  style={{ ...pct([s.hot[0], s.hot[1]]), width: `${s.hot[2] / 20}%`, height: `${s.hot[3] / 11.16}%` }} />
                <div className="sd-glow" style={{ ...pct(s.screen), background: `radial-gradient(ellipse, ${s.c}55 0%, ${s.c}00 65%)`, opacity: st === 'away' ? 0 : st === 'toSign' ? 0.9 : 0.5 }} />
              </div>
            );
          })}
          <div className="sd-dim" style={pct([SEATS.nico.hot[0], SEATS.nico.hot[1]])} />
          <div className="sd-clock" aria-label={t('st.clock')}>
            <b style={{ left: '68.4%', top: '7%', width: '6.4%', height: '4.9%' }}><span>{clock.sf}</span><small>{clock.sfDate}</small></b>
            <b style={{ left: '76.9%', top: '7%', width: '6.4%', height: '4.9%' }}><span>{clock.bog}</span><small>{clock.bogDate}</small></b>
          </div>
        </div>

        <div className="sd-bubbles">
          {SEAT_ORDER.map((id) => {
            const v = seats[id], st = shown(id);
            return (
              <div key={id} className="sd-bubble" style={pct(SEATS[id].bub)}>
                <div className="who"><i style={{ background: st === 'away' ? '#5A6280' : SEATS[id].c }} />{SEAT_NAME[id]}</div>
                <div className="st">{t(stateKey(st))}</div>
                <div>{st === 'away' ? away?.back : v.now ? (brandView ? v.now.title : `${v.now.title} · ${brand(v.now.brandId)}`) : idle(id)[0]}</div>
              </div>
            );
          })}
        </div>
        {!brandView && toSignCount > 0 && <span className="sd-badge">{t('st.toSign', { n: toSignCount })}</span>}
        <span className="sd-hint">{t('st.hint')}</span>
        {isSimulated && (
          <button type="button" className="sd-sim" onClick={() => { location.href = location.pathname; }}>
            {t('st.simulated', { when: new Intl.DateTimeFormat(locale(lang), { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(studioNow()) })} · <u>{t('st.realTime')}</u>
          </button>
        )}

        <video ref={closeRef} className={`sd-closeup ${closeOn ? 'on' : ''}`} muted loop playsInline preload="none" aria-hidden="true" />
        {focused && <FocusCard key={focused} id={focused} view={seats[focused]} open allItems={items} readOnly={brandView} stateLabel={t(stateKey(shown(focused)))} away={focused === 'nico' ? away : undefined} idle={idle(focused)} />}
        <button type="button" className="sd-back" onClick={zoomOut}>← {t('st.back')}</button>
      </div>
    </div>
  );
}
