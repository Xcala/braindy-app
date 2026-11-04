import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { brainName } from '../components/BrainStack';
import type { BrainId } from './taxonomy';
import type { BrandRequest } from './types';
import { KIND_OF, RELAY, TASKS } from './teamWork';
import { LOG, VARIANT_OF } from './teamLog';
import { Scene, sayIn } from './TeamScenes';
import './teamAtWork.css';

/** Each Brain works for this long before passing the piece on; its log moves a line every third of it. */
const STEP_MS = 9000;
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Which Brain has the piece right now in the loop. Every card on screen shares the same clock, so they move together. */
function useRelay() {
  const at = () => Math.floor(Date.now() / STEP_MS) % RELAY.length;
  const [i, setI] = useState(at);
  useEffect(() => {
    if (still()) return;
    const id = setInterval(() => setI(at()), 400);
    return () => clearInterval(id);
  }, []);
  return i;
}

/**
 * The four Brains working on a request, one after another like an agency team: Researcher, Marketer, Creator, Builder.
 * Beside them, the one at work is seen doing it (the search, the positioning map, the wireframe turning into the mockup,
 * the code going live), drawn for the kind of piece: a site, a logo, a video or a document. When the team left a note
 * for that Brain on this request, the note shows as its task. `compact` is the one-line version for the home cards.
 */
export function TeamAtWork({ r, compact = false }: { r: Pick<BrandRequest, 'category' | 'teamNotes' | 'title'>; compact?: boolean }) {
  const { t, lang } = useI18n();
  const brand = useBrandsMaybe()?.current?.name ?? 'Braindy';
  const i = useRelay();
  const kind = KIND_OF[r.category] ?? 'study';
  const variant = VARIANT_OF[kind];
  const task = (b: BrainId) => r.teamNotes?.[b]?.trim() || TASKS[kind][b][lang];
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
                {k === i && (
                  <span className="tw-log" key={now}>
                    {LOG[variant][b].map((l, n) => <span key={n} style={{ ['--d' as string]: `${n * 3}s` }}><i />{l[lang]}</span>)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
        <Scene key={now} brain={now} variant={variant} title={r.title} brand={brand} say={sayIn(lang)} />
      </div>
    </section>
  );
}
