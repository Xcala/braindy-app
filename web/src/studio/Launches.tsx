import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { LaunchModal, type Work } from './LaunchModal';

/** Reactions a client can leave on a launch, like on social media. Everyone sees the counts. Same list as the API. */
const REACTIONS = [['fire', '🔥'], ['love', '😍'], ['clap', '👏'], ['idea', '💡']] as const;
type Reaction = (typeof REACTIONS)[number][0];
export interface Launch extends Work { brandId: string; brandName: string; counts: Record<Reaction, number>; mine: Reaction[] }

export const fetchLaunches = () => api<{ items: Launch[] }>('/v1/launches').then((r) => r.items);
const fetchOwn = (brandId: string) => api<{ items: Work[] }>(`/v1/brands/${brandId}/launches/own`).then((r) => r.items);
export const setLaunch = (brandId: string, requestId: string, versionId: string, on: boolean, title = '') =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/launch`, { method: 'POST', body: JSON.stringify({ on, title }) });
const react = (id: string, reaction: Reaction, on: boolean) =>
  api(`/v1/launches/${id}/reaction`, { method: 'POST', body: JSON.stringify({ reaction, on }) });

const SECONDS_PER_ITEM = 7;

/**
 * Under the studio, always shown: a news-crawl band of what was just launched, with two tabs:
 * the brand's own latest finished work, and the Braindy community (other brands, chosen by NickMark,
 * with reactions). Tapping an item opens it big.
 */
export function Launches() {
  const { t, lang } = useI18n();
  const brand = useBrandsMaybe()?.current ?? null;
  const [own, setOwn] = useState<Work[]>([]);
  const [others, setOthers] = useState<Launch[]>([]);
  const [tab, setTab] = useState<'own' | 'others' | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([brand ? fetchOwn(brand.id).catch(() => []) : Promise.resolve([]), fetchLaunches().catch(() => [])]).then(([o, l]) => {
      if (!live) return;
      setOwn(o); setOthers(l.filter((x) => x.brandId !== brand?.id)); setTab((cur) => cur ?? (o.length || !brand ? (brand ? 'own' : 'others') : 'others'));
    });
    return () => { live = false; };
  }, [brand?.id]);
  const shown = brand ? (tab ?? 'own') : 'others';
  const list: Array<Work & Partial<Launch>> = shown === 'own' ? own : others;
  const date = (ms: number | null) => (ms ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }).format(ms) : '');
  const subOf = (w: Work & Partial<Launch>) => `${w.brandName ?? brand?.name ?? ''}${w.at ? ` · ${date(w.at)}` : ''}`;

  // Optimistic: the count moves at once and goes back if the API refuses.
  function toggle(l: Launch, r: Reaction) {
    const on = !l.mine.includes(r);
    const apply = (yes: boolean) => setOthers((all) => all.map((x) => (x.id !== l.id ? x : {
      ...x, mine: yes ? [...x.mine, r] : x.mine.filter((m) => m !== r), counts: { ...x.counts, [r]: Math.max(0, (x.counts[r] ?? 0) + (yes ? 1 : -1)) },
    })));
    apply(on);
    react(l.id, r, on).catch(() => apply(!on));
  }

  const moving = list.length >= 3;
  const item = (w: Work & Partial<Launch>, copy = false) => (
    <li key={`${copy ? 'c' : 'a'}-${w.id}`} aria-hidden={copy || undefined}>
      <button type="button" className="sd-ticker-item" tabIndex={copy ? -1 : undefined} onClick={() => setOpen(w.id)}>
        {w.kind === 'video' ? <video src={w.url} muted playsInline preload="metadata" aria-hidden="true" /> : <img src={w.url} alt="" loading="lazy" />}
        <span className="col min-w-0"><b className="t-sm truncate">{w.title}</b><span className="t-xs t-mute truncate">{subOf(w)}</span></span>
      </button>
    </li>
  );
  const current = list.find((w) => w.id === open);
  const reactions = (l: Launch) => (
    <div className="row g6 wrap" role="group" aria-label={t('st.react')}>
      {REACTIONS.map(([r, emoji]) => {
        const on = l.mine.includes(r), n = l.counts?.[r] ?? 0;
        return (
          <button key={r} type="button" className={`sd-react ${on ? 'on' : ''}`} aria-pressed={on} aria-label={t(`st.react.${r}` as StringKey)} onClick={() => toggle(l, r)}>
            <span aria-hidden="true">{emoji}</span>{n > 0 && <span className="t-xs">{n}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="card sd-ticker" aria-labelledby="h-launches">
      <div className="sd-ticker-head">
        <span className="label" id="h-launches"><i aria-hidden="true" />{t('st.launches')}</span>
        {brand && (
          <div className="seg" role="tablist" aria-label={t('st.launches')}>
            {(['own', 'others'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={shown === k} className={shown === k ? 'is-on' : ''} onClick={() => setTab(k)}>
                {t(k === 'own' ? 'st.launchesOwn' : 'st.launchesOthers')}
              </button>
            ))}
          </div>
        )}
      </div>
      {list.length === 0
        ? <p className="sd-ticker-empty t-sm t-mute">{t(shown === 'own' ? 'st.launchesEmptyOwn' : 'st.launchesEmptyOthers')}</p>
        : (
          <div className="sd-ticker-track">
            <ul className={`sd-ticker-run ${moving ? 'is-moving' : ''}`} style={{ ['--crawl' as string]: `${list.length * SECONDS_PER_ITEM}s` }}>
              {list.map((w) => item(w))}
              {moving && list.map((w) => item(w, true))}
            </ul>
          </div>
        )}
      {current && (
        <LaunchModal w={current} sub={subOf(current)} onClose={() => setOpen(null)}>
          {shown === 'others' && current.counts && reactions(current as Launch)}
        </LaunchModal>
      )}
    </section>
  );
}
