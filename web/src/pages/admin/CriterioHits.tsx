import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import type { Objection } from '../../criterio/useCriterio';

type Hit = { shown: number; opened: number; sent: number; brands: Set<string> };
type Hits = Record<string, Hit>;
type State = { status: 'loading' } | { status: 'error'; msg: string } | { status: 'ok'; hits: Hits };

/**
 * UX CR2: «What comes up most · 90 days», at the top of the Objections tab. One line when empty,
 * the real error (with Retry) when the read fails, and «7 times · 4 brands» per objection with the detail on tap.
 */
export function CriterioHits({ objections }: { objections: Objection[] }) {
  const { t, lang } = useI18n();
  const [state, reload] = useHits();
  const hits = state.status === 'ok' ? state.hits : {};
  const ranked = objections.filter((o) => hits[o.id]).sort((a, b) => hits[b.id].shown - hits[a.id].shown);
  return (
    <section className="card col g8" aria-labelledby="h-hits" style={{ padding: '1rem' }}>
      <h2 className="row between g8 t-sm w7" id="h-hits">
        <span>{t('cra.topHits')}</span>
        {state.status === 'ok' && ranked.length > 0 && <span className="chip chip-plain c-draft">{ranked.length}</span>}
      </h2>
      {state.status === 'loading' && <div className="skel" style={{ height: '1.25rem', width: '60%' }} aria-hidden="true" />}
      {state.status === 'error' && (
        <p className="t-sm row g8 wrap" role="alert">
          <span style={{ color: 'var(--danger)' }}>{t('cra.hitsError', { msg: state.msg })}</span>
          <button type="button" className="btn btn-text btn-sm" onClick={reload}>{t('cra.retry')}</button>
        </p>
      )}
      {state.status === 'ok' && !ranked.length && <p className="t-sm t-mute">{t('cra.noHits')}</p>}
      {ranked.map((o) => {
        const h = hits[o.id];
        return (
          <details key={o.id} className="cra-hit t-sm">
            <summary className="row between g12 wrap">
              <span className="w7">«{o.phrase[lang]}»</span>
              <span className="t-mute">
                {h.shown === 1 ? t('cra.timesOne') : t('cra.times', { n: h.shown })} · {h.brands.size === 1 ? t('cra.brandsOne') : t('cra.brandsMany', { n: h.brands.size })}
              </span>
            </summary>
            <p className="t-xs t-mute" style={{ marginTop: '0.25rem' }}>
              {h.shown} {t('cra.shown')} · {h.opened} {t('cra.opened')} · {h.sent} {t('cra.sent')}
            </p>
          </details>
        );
      })}
    </section>
  );
}

function useHits(): [State, () => void] {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    setState({ status: 'loading' });
    const since = Timestamp.fromMillis(Date.now() - 90 * 864e5);
    getDocs(query(collection(db, 'criterioHits'), where('at', '>=', since))).then((s) => {
      const h: Hits = {};
      for (const d of s.docs) {
        const id = String(d.get('objectionId'));
        h[id] ??= { shown: 0, opened: 0, sent: 0, brands: new Set() };
        const out = d.get('outcome') as 'shown' | 'opened' | 'sent';
        if (out in h[id]) h[id][out]++;
        h[id].brands.add(String(d.get('brandId')));
      }
      setState({ status: 'ok', hits: h });
    }).catch((e: unknown) => setState({ status: 'error', msg: e instanceof Error ? e.message : String(e) }));
  }, [tick]);
  return [state, reload];
}
