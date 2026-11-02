import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import type { BrainId } from './taxonomy';
import type { BrandRequest } from './types';
import { KIND_OF, RELAY, TASKS } from './teamWork';
import './teamAtWork.css';

const STEP_MS = 3500;
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Which Brain has the piece right now in the loop. Every card on screen shares the same clock, so they move together. */
function useRelay() {
  const at = () => Math.floor(Date.now() / STEP_MS) % RELAY.length;
  const [i, setI] = useState(at);
  useEffect(() => {
    if (still()) return;
    const id = setInterval(() => setI(at()), 500);
    return () => clearInterval(id);
  }, []);
  return i;
}

/** The piece as it grows: references, then the strategy, then the design, then the build going live. */
function Piece({ brain, live }: { brain: BrainId; live: string }) {
  return (
    <div className={`tw-piece is-${brain}`} aria-hidden="true">
      {brain === 'researcher' && <><i className="tw-ref" /><i className="tw-ref" /><i className="tw-ref" /><b className="tw-lens" /></>}
      {brain === 'marketer' && <><span className="tw-target"><i /><i /><i /></span><span className="tw-bars"><i /><i /><i /></span></>}
      {brain === 'creator' && <span className="tw-frame"><i /><i /><i /><i /></span>}
      {brain === 'builder' && <span className="tw-code"><i /><i /><i /><i /><b className="tw-live">● {live}</b></span>}
    </div>
  );
}

/**
 * The four Brains working on a request, one after another like an agency team: Researcher, Marketer, Creator, Builder.
 * What each one does depends on the kind of piece (a site, a logo, a brochure, a video). When the team left a note for
 * that Brain on this request, the note shows instead. `compact` is the one-line version for the home cards.
 */
export function TeamAtWork({ r, compact = false }: { r: Pick<BrandRequest, 'category' | 'teamNotes'>; compact?: boolean }) {
  const { t, lang } = useI18n();
  const i = useRelay();
  const tasks = TASKS[KIND_OF[r.category] ?? 'study'];
  const task = (b: BrainId) => r.teamNotes?.[b]?.trim() || tasks[b][lang];
  const now = RELAY[i];

  if (compact) {
    return (
      <span className="tw-mini row g8 min-w-0">
        <span className="row flex-none">
          {RELAY.map((b, k) => (
            <span key={b} className={`brain xs b-${b} ${k === i ? 'brain-working' : 'tw-off'}`} style={{ marginLeft: k ? -5 : 0 }}><img src={`/brand/brains/${b}.png`} alt="" /></span>
          ))}
        </span>
        <span className="t-xs t-mute truncate" key={now}><b className="tw-who" style={{ color: `var(--${now})` }}>{brainName(now)}</b> {task(now).charAt(0).toLowerCase() + task(now).slice(1)}</span>
      </span>
    );
  }

  return (
    <section className="card col g16 tw" aria-labelledby="h-team">
      <div className="col g4">
        <h2 className="h3" id="h-team">{t('tw.title')}</h2>
        <p className="t-sm t-mute">{t('tw.sub')}</p>
      </div>
      <div className="tw-body">
        <ol className="tw-relay">
          {RELAY.map((b, k) => (
            <li key={b} className={`tw-step b-${b} ${k === i ? 'on' : k < i ? 'done' : ''}`} aria-current={k === i ? 'step' : undefined}>
              <span className={`brain sm b-${b} ${k === i ? 'brain-working' : ''}`}><img src={`/brand/brains/${b}.png`} alt="" /></span>
              <span className="col min-w-0">
                <b className="t-sm">{brainName(b)}</b>
                <span className="t-xs t-mute">{task(b)}</span>
              </span>
            </li>
          ))}
        </ol>
        <Piece key={now} brain={now} live={lang === 'es' ? 'Publicado' : 'Live'} />
      </div>
    </section>
  );
}
