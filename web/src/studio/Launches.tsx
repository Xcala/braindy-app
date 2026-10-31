import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { LaunchModal, type Work } from './LaunchModal';
import { cityCode, type CityPlace } from '../brands/cities';

/** Reactions a client can leave on a launch, like on social media. Everyone sees the counts. Same list as the API. */
const REACTIONS = [['fire', '🔥'], ['love', '😍'], ['clap', '👏'], ['idea', '💡']] as const;
type Reaction = (typeof REACTIONS)[number][0];
export interface Launch extends Work { brandId: string; brandName: string; city?: string | CityPlace | null; counts: Record<Reaction, number>; mine: Reaction[] }
type Item = Work & Partial<Launch> & { community: boolean };

export const fetchLaunches = () => api<{ items: Launch[] }>('/v1/launches').then((r) => r.items);
const fetchOwn = (brandId: string) => api<{ items: Work[] }>(`/v1/brands/${brandId}/launches/own`).then((r) => r.items);
export const setLaunch = (brandId: string, requestId: string, versionId: string, on: boolean, title = '') =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/launch`, { method: 'POST', body: JSON.stringify({ on, title }) });
const react = (id: string, reaction: Reaction, on: boolean) =>
  api(`/v1/launches/${id}/reaction`, { method: 'POST', body: JSON.stringify({ reaction, on }) });

const SECONDS_PER_ITEM = 6;
/** The loop repeats short lists so the band is always full before it wraps around. */
const MIN_RUN = 8;

/**
 * Under the studio: an endless marquee of what was just launched. The brand's own finished work and the
 * community's launches (other brands, chosen by NickMark) run together, newest first; the community ones carry
 * a "Brainders community" tag. Tapping an item opens it big (community ones with reactions). Titled "Latest launches"; each piece carries its brand's city (BOG, NYC). Hidden while empty.
 */
export function Launches() {
  const { t, lang } = useI18n();
  const brand = useBrandsMaybe()?.current ?? null;
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([brand ? fetchOwn(brand.id).catch(() => []) : Promise.resolve([]), fetchLaunches().catch(() => [])]).then(([o, l]) => {
      if (!live) return;
      const own: Item[] = o.map((w) => ({ ...w, city: brand?.city ?? null, community: false }));
      const others: Item[] = l.filter((x) => x.brandId !== brand?.id).map((x) => ({ ...x, community: true }));
      setItems([...own, ...others].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)));
    });
    return () => { live = false; };
  }, [brand?.id]);
  const date = (ms: number | null) => (ms ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }).format(ms) : '');
  const subOf = (w: Item) => `${w.brandName ?? brand?.name ?? ''}${w.at ? ` · ${date(w.at)}` : ''}`;

  // Optimistic: the count moves at once and goes back if the API refuses.
  function toggle(l: Item, r: Reaction) {
    const on = !l.mine!.includes(r);
    const apply = (yes: boolean) => setItems((all) => all.map((x) => (x.id !== l.id || !x.community ? x : {
      ...x, mine: yes ? [...x.mine!, r] : x.mine!.filter((m) => m !== r), counts: { ...x.counts!, [r]: Math.max(0, (x.counts?.[r] ?? 0) + (yes ? 1 : -1)) },
    })));
    apply(on);
    react(l.id, r, on).catch(() => apply(!on));
  }

  if (!items.length) return null;
  const run = Array.from({ length: Math.ceil(MIN_RUN / items.length) }, () => items).flat();
  const key = (w: Item) => `${w.community ? 'c' : 'o'}-${w.id}`;
  const item = (w: Item, i: number, copy: boolean) => (
    <li key={`${i}-${key(w)}`} aria-hidden={copy || undefined}>
      <button type="button" className="sd-ticker-item" tabIndex={copy ? -1 : undefined} onClick={() => setOpen(key(w))}>
        <span className="sd-thumb">
          {w.kind === 'video' ? <video src={w.url} muted playsInline preload="metadata" aria-hidden="true" /> : <img src={w.url} alt="" decoding="async" fetchPriority="low" />}
          {cityCode(w.city) && <i className="sd-city">{cityCode(w.city)}</i>}
        </span>
        <span className="col min-w-0">
          {w.community && <span className="sd-community">{t('st.community')}</span>}
          <b className="t-sm truncate">{w.title}</b>
          <span className="t-xs t-mute truncate">{subOf(w)}</span>
        </span>
      </button>
    </li>
  );
  const current = items.find((w) => key(w) === open);

  return (
    <section className="sd-launches" aria-labelledby="h-launches">
      <h2 className="sd-launches-title" id="h-launches">{t('st.latest')}</h2>
      <div className="sd-ticker">
        <ul className="sd-ticker-run" style={{ ['--crawl' as string]: `${run.length * SECONDS_PER_ITEM}s` }}>
          {run.map((w, i) => item(w, i, i >= items.length))}
          {run.map((w, i) => item(w, run.length + i, true))}
        </ul>
      </div>
      {current && (
        <LaunchModal w={current} sub={subOf(current)} onClose={() => setOpen(null)}>
          {current.community && current.counts && (
            <div className="row g6 wrap" role="group" aria-label={t('st.react')}>
              {REACTIONS.map(([r, emoji]) => {
                const on = current.mine!.includes(r), n = current.counts?.[r] ?? 0;
                return (
                  <button key={r} type="button" className={`sd-react ${on ? 'on' : ''}`} aria-pressed={on} aria-label={t(`st.react.${r}` as StringKey)} onClick={() => toggle(current, r)}>
                    <span aria-hidden="true">{emoji}</span>{n > 0 && <span className="t-xs">{n}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </LaunchModal>
      )}
    </section>
  );
}
