import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';
import { useBrandsMaybe } from '../brands/BrandProvider';

/** Reactions a client can leave on a launch, like on social media. Everyone sees the counts. Same list as the API. */
const REACTIONS = [['fire', '🔥'], ['love', '😍'], ['clap', '👏'], ['idea', '💡']] as const;
type Reaction = (typeof REACTIONS)[number][0];

const media = { width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)', background: '#000' } as const;

interface Work { id: string; title: string; category: string | null; kind: 'image' | 'video'; at: number | null; url: string }
export interface Launch extends Work { brandId: string; brandName: string; counts: Record<Reaction, number>; mine: Reaction[] }

export const fetchLaunches = () => api<{ items: Launch[] }>('/v1/launches').then((r) => r.items);
const fetchOwn = (brandId: string) => api<{ items: Work[] }>(`/v1/brands/${brandId}/launches/own`).then((r) => r.items);
export const setLaunch = (brandId: string, requestId: string, versionId: string, on: boolean, title = '') =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/launch`, { method: 'POST', body: JSON.stringify({ on, title }) });
const react = (id: string, reaction: Reaction, on: boolean) =>
  api(`/v1/launches/${id}/reaction`, { method: 'POST', body: JSON.stringify({ reaction, on }) });

/**
 * Beside the studio (below it on phones), two tabs: the brand's own latest finished work,
 * and what NickMark chose to show from other brands (with reactions). Hidden while both are empty.
 */
export function Launches() {
  const { t, lang } = useI18n();
  const brand = useBrandsMaybe()?.current ?? null;
  const [own, setOwn] = useState<Work[]>([]);
  const [others, setOthers] = useState<Launch[]>([]);
  const [tab, setTab] = useState<'own' | 'others' | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([brand ? fetchOwn(brand.id).catch(() => []) : Promise.resolve([]), fetchLaunches().catch(() => [])]).then(([o, l]) => {
      if (!live) return;
      setOwn(o); setOthers(l.filter((x) => x.brandId !== brand?.id)); setTab((cur) => cur ?? (o.length ? 'own' : 'others'));
    });
    return () => { live = false; };
  }, [brand?.id]);
  if (!own.length && !others.length) return null;
  const shown = tab === 'own' ? 'own' : others.length ? 'others' : 'own';
  const date = (ms: number | null) => (ms ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }).format(ms) : '');

  // Optimistic: the count moves at once and goes back if the API refuses.
  function toggle(l: Launch, r: Reaction) {
    const on = !l.mine.includes(r);
    const apply = (yes: boolean) => setOthers((all) => all.map((x) => (x.id !== l.id ? x : {
      ...x, mine: yes ? [...x.mine, r] : x.mine.filter((m) => m !== r), counts: { ...x.counts, [r]: Math.max(0, (x.counts[r] ?? 0) + (yes ? 1 : -1)) },
    })));
    apply(on);
    react(l.id, r, on).catch(() => apply(!on));
  }

  const card = (w: Work, sub: string, extra?: React.ReactNode) => (
    <li key={w.id} className="col g6">
      {w.kind === 'video'
        ? <video src={w.url} aria-label={w.title} muted loop playsInline autoPlay controls preload="metadata" style={media} />
        : <img src={w.url} alt={w.title} loading="lazy" style={media} />}
      <div className="col"><b className="t-sm">{w.title}</b><span className="t-xs t-mute">{sub}{w.at ? ` · ${date(w.at)}` : ''}</span></div>
      {extra}
    </li>
  );

  return (
    <aside className="card col g12 min-w-0 sd-launches" aria-labelledby="h-launches">
      <h2 className="h3" id="h-launches">{t('st.launches')}</h2>
      {own.length > 0 && others.length > 0 && (
        <div className="seg" role="tablist" aria-label={t('st.launches')} style={{ alignSelf: 'flex-start' }}>
          <button type="button" role="tab" aria-selected={shown === 'own'} className={shown === 'own' ? 'is-on' : ''} onClick={() => setTab('own')}>{t('st.launchesOwn')}</button>
          <button type="button" role="tab" aria-selected={shown === 'others'} className={shown === 'others' ? 'is-on' : ''} onClick={() => setTab('others')}>{t('st.launchesOthers')}</button>
        </div>
      )}
      <p className="t-sm t-mute">{t(shown === 'own' ? 'st.launchesOwnSub' : 'st.launchesSub')}</p>
      <ul className="col g16" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {shown === 'own'
          ? own.map((w) => card(w, brand?.name ?? ''))
          : others.map((l) => card(l, l.brandName, (
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
          )))}
      </ul>
    </aside>
  );
}
