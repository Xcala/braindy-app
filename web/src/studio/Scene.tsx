import { useEffect, useRef, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { WorkItem } from '../team/useWork';
import { CLOSEUP, SEAT_ORDER, SEATS, pct, zoomTo, type SeatId } from './geometry';
import { FocusCard, SEAT_NAME } from './FocusCard';
import type { SeatView } from './useStudio';
import './studio.css';

const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (tz: string) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

function useClock() {
  const [now, setNow] = useState(() => ({ sf: fmt('America/Los_Angeles'), bog: fmt('America/Bogota') }));
  useEffect(() => { const id = setInterval(() => setNow({ sf: fmt('America/Los_Angeles'), bog: fmt('America/Bogota') }), 20000); return () => clearInterval(id); }, []);
  return now;
}

/** The studio photo with its live layer: loop video, glowing screens, bubbles, wall clock and zoom into each seat. */
export function Scene({ seats, items, toSignCount }: { seats: Record<SeatId, SeatView>; items: WorkItem[]; toSignCount: number }) {
  const { t } = useI18n();
  const { brands } = useBrands();
  const brand = (id?: string) => brands.find((b) => b.id === id)?.name ?? '';
  const sceneRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLVideoElement>(null);
  const [focused, setFocused] = useState<SeatId | null>(null);
  const [transform, setTransform] = useState('');
  const [closeOn, setCloseOn] = useState(false);
  const [loopOn, setLoopOn] = useState(false);
  const clock = useClock();

  useEffect(() => {
    if (!focused) return;
    const place = () => { const el = sceneRef.current; if (el) setTransform(zoomTo(focused, el.clientWidth, el.clientHeight)); };
    place();
    setCloseOn(false);
    const v = closeRef.current;
    let timer = 0;
    if (v && !reduce) { v.src = `/studio/${CLOSEUP[focused]}.mp4`; v.play?.().catch(() => {}); timer = window.setTimeout(() => setCloseOn(true), 800); }
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
      <div ref={sceneRef} className={`sd-scene ${focused ? 'zoomed' : ''}`} onClick={(e) => { if (focused && !(e.target as HTMLElement).closest('.sd-focus')) zoomOut(); }}>
        <div className="sd-cam" style={{ transform }}>
          <img src="/studio/studio.jpg" alt={t('st.title')} />
          {!reduce && <video className={loopOn ? 'on' : ''} src="/studio/loop.mp4" autoPlay muted loop playsInline aria-hidden="true" onPlaying={() => setLoopOn(true)} />}
          {SEAT_ORDER.map((id) => {
            const s = SEATS[id], st = seats[id].state;
            return (
              <div key={id}>
                <button type="button" className="sd-hot" aria-label={`${SEAT_NAME[id]}: ${t(`st.state.${st}` as StringKey)}`} onClick={() => setFocused(id)}
                  style={{ ...pct([s.hot[0], s.hot[1]]), width: `${s.hot[2] / 20}%`, height: `${s.hot[3] / 11.16}%` }} />
                <div className="sd-glow" style={{ ...pct(s.screen), background: `radial-gradient(ellipse, ${s.c}55 0%, ${s.c}00 65%)`, opacity: st === 'free' ? 0.15 : st === 'toSign' ? 0.9 : 0.5 }} />
              </div>
            );
          })}
          <div className="sd-clock" aria-label={t('st.clock')}>
            <b style={{ left: '68.4%', top: '7%', width: '6.4%', height: '4.9%' }}>{clock.sf}</b>
            <b style={{ left: '76.9%', top: '7%', width: '6.4%', height: '4.9%' }}>{clock.bog}</b>
          </div>
        </div>

        <div className="sd-bubbles">
          {SEAT_ORDER.map((id) => {
            const v = seats[id];
            return (
              <div key={id} className="sd-bubble" style={pct(SEATS[id].bub)}>
                <div className="who"><i style={{ background: SEATS[id].c }} />{SEAT_NAME[id]}</div>
                <div className="st">{t(`st.state.${v.state}` as StringKey)}</div>
                <div>{v.now ? `${v.now.title} · ${brand(v.now.brandId)}` : t('st.nothing')}</div>
              </div>
            );
          })}
        </div>
        {toSignCount > 0 && <span className="sd-badge">{t('st.toSign', { n: toSignCount })}</span>}
        <span className="sd-hint">{t('st.hint')}</span>

        <video ref={closeRef} className={`sd-closeup ${closeOn ? 'on' : ''}`} muted loop playsInline preload="none" aria-hidden="true" />
        {focused && <FocusCard key={focused} id={focused} view={seats[focused]} open allItems={items} />}
        <button type="button" className="sd-back" onClick={zoomOut}>← {t('st.back')}</button>
      </div>
    </div>
  );
}
