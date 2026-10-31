import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';

/** Reactions a client can leave on a launch, like on social media. Everyone sees the counts. Same list as the API. */
const REACTIONS = [['fire', '🔥'], ['love', '😍'], ['clap', '👏'], ['idea', '💡']] as const;
type Reaction = (typeof REACTIONS)[number][0];

export interface Launch { id: string; brandName: string; title: string; category: string | null; at: number | null; url: string; counts: Record<Reaction, number>; mine: Reaction[] }

export const fetchLaunches = () => api<{ items: Launch[] }>('/v1/launches').then((r) => r.items);
export const setLaunch = (brandId: string, requestId: string, versionId: string, on: boolean, title = '') =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/launch`, { method: 'POST', body: JSON.stringify({ on, title }) });
const react = (id: string, reaction: Reaction, on: boolean) =>
  api(`/v1/launches/${id}/reaction`, { method: 'POST', body: JSON.stringify({ reaction, on }) });

/** Work just launched for other brands, chosen by NickMark, beside the studio (below it on phones). Hidden while there is none. */
export function Launches() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Launch[]>([]);
  useEffect(() => { fetchLaunches().then(setItems).catch(() => setItems([])); }, []);
  if (!items.length) return null;
  const date = (ms: number | null) => (ms ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }).format(ms) : '');

  // Optimistic: the count moves at once and goes back if the API refuses.
  function toggle(l: Launch, r: Reaction) {
    const on = !l.mine.includes(r);
    const apply = (yes: boolean) => setItems((all) => all.map((x) => (x.id !== l.id ? x : {
      ...x, mine: yes ? [...x.mine, r] : x.mine.filter((m) => m !== r), counts: { ...x.counts, [r]: Math.max(0, (x.counts[r] ?? 0) + (yes ? 1 : -1)) },
    })));
    apply(on);
    react(l.id, r, on).catch(() => apply(!on));
  }

  return (
    <aside className="card col g12 min-w-0 sd-launches" aria-labelledby="h-launches">
      <div className="col g4">
        <h2 className="h3" id="h-launches">{t('st.launches')}</h2>
        <p className="t-sm t-mute">{t('st.launchesSub')}</p>
      </div>
      <ul className="col g16" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((l) => (
          <li key={l.id} className="col g6">
            <img src={l.url} alt={l.title} loading="lazy" style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
            <div className="col">
              <b className="t-sm">{l.title}</b>
              <span className="t-xs t-mute">{l.brandName}{l.at ? ` · ${date(l.at)}` : ''}</span>
            </div>
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
          </li>
        ))}
      </ul>
    </aside>
  );
}
