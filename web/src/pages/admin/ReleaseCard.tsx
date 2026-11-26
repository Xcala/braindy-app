import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nProvider';

type Run = { id: number; status: string; conclusion: string | null; at: string; url: string; sha: string };
type Status = { configured: boolean; error?: string; live?: string | null; main?: string; pending?: { sha: string; title: string; at: string }[] | null; runs?: Run[] };

/** Admin · Today: «Sube» without a computer. Shows what production is missing and publishes main through GitHub. */
export function ReleaseCard() {
  const { t, lang } = useI18n();
  const [st, setSt] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const load = useCallback(() => { api<Status>('/v1/admin/release/status').then(setSt).catch(() => setSt({ configured: true, error: 'github' })); }, []);
  useEffect(() => { load(); }, [load]);
  const running = st?.runs?.some((r) => r.status !== 'completed');
  // While a publish runs, look again every 20 s so the card turns to «up to date» by itself.
  useEffect(() => { if (!running) return; const id = setInterval(load, 20_000); return () => clearInterval(id); }, [running, load]);
  if (!st) return null;
  if (!st.configured) return <section className="card"><p className="t-sm t-mute">{t('rel.off')}</p></section>;

  const last = st.runs?.[0];
  const when = (iso: string) => new Date(iso).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const pending = st.pending;
  const upToDate = Array.isArray(pending) && pending.length === 0;
  const publish = async () => {
    if (!window.confirm(t('rel.confirm'))) return;
    setBusy(true); setNote(null);
    try { await api('/v1/admin/release/publish', { method: 'POST' }); setNote(t('rel.started')); setTimeout(load, 4000); } catch { setNote(t('rel.error')); } finally { setBusy(false); }
  };

  return (
    <section className="card col g8" aria-label={t('rel.title')}>
      <div className="row between"><h2 className="h3">{t('rel.title')}</h2>
        {pending && pending.length > 0 && <span className="chip chip-plain" style={{ background: 'var(--col)', color: 'var(--ink)' }}>{pending.length}</span>}</div>
      {st.error ? <p className="t-sm t-mute">{t('rel.error')}</p> : running ? <p className="t-sm">{t('rel.running')}</p> : upToDate ? <p className="t-sm t-mute">{t('rel.upToDate')}</p> : (
        <>
          <p className="t-sm">{pending ? t('rel.pending', { n: pending.length }) : t('rel.unknown')}</p>
          {pending && <ul className="col g4 t-xs t-mute" style={{ margin: 0, paddingLeft: '1rem' }}>{pending.slice(0, 8).map((p) => <li key={p.sha} className="truncate">{p.title}</li>)}</ul>}
          <div><button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void publish()}>{t('rel.publish')}</button></div>
        </>
      )}
      {note && <p className="t-xs" role="status">{note}</p>}
      {last && <p className="t-xs t-mute" style={{ margin: 0 }}>{t('rel.last', { when: when(last.at) })} · {last.status !== 'completed' ? t('rel.running') : last.conclusion === 'success' ? t('rel.ok') : t('rel.failed')} · <a href={last.url} target="_blank" rel="noreferrer">{t('rel.see')}</a></p>}
    </section>
  );
}
