import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';

export interface Launch { id: string; brandName: string; title: string; category: string | null; at: number | null; url: string }

export const fetchLaunches = () => api<{ items: Launch[] }>('/v1/launches').then((r) => r.items);
export const setLaunch = (brandId: string, requestId: string, versionId: string, on: boolean, title = '') =>
  api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/launch`, { method: 'POST', body: JSON.stringify({ on, title }) });

/** Work just launched for other brands, chosen by NickMark, beside the studio (below it on phones). Hidden while there is none. */
export function Launches({ ask = false }: { ask?: boolean }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Launch[]>([]);
  useEffect(() => { fetchLaunches().then(setItems).catch(() => setItems([])); }, []);
  if (!items.length) return null;
  const date = (ms: number | null) => (ms ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }).format(ms) : '');

  return (
    <aside className="card col g12 min-w-0 sd-launches" aria-labelledby="h-launches">
      <div className="col g4">
        <h2 className="h3" id="h-launches">{t('st.launches')}</h2>
        <p className="t-sm t-mute">{t('st.launchesSub')}</p>
      </div>
      <ul className="col g12" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((l) => (
          <li key={l.id} className="col g6">
            <img src={l.url} alt={l.title} loading="lazy" style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
            <div className="col">
              <b className="t-sm">{l.title}</b>
              <span className="t-xs t-mute">{l.brandName}{l.at ? ` · ${date(l.at)}` : ''}</span>
            </div>
          </li>
        ))}
      </ul>
      {ask && <Link to="/requests#ask" className="btn btn-secondary">{t('st.launchesAsk')}</Link>}
    </aside>
  );
}
