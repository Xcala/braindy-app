import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { createRequest } from '../requests/api';
import { pct, STATUSES, useSiteChanges, type SiteChange } from './SiteChanges';

/**
 * The narrow column beside the site in the viewer: the site's adjustments triage at a glance
 * (open points first, delivered folded) and a box to ask for one more adjustment, which becomes a web request.
 */
export function SitePanel({ brandId, url }: { brandId: string; url: string }) {
  const { t } = useI18n();
  const list = useSiteChanges(brandId);
  const open = list.filter((x) => x.status !== 'delivered' && x.status !== 'discarded');
  const done = list.filter((x) => x.status === 'delivered');
  const total = pct(list);
  const counts = STATUSES.map((s) => [s, list.filter((x) => x.status === s).length] as const).filter(([, n]) => n);

  return (
    <aside id="site-panel" className="spanel sx" aria-labelledby="sp-title">
      <header className="col g8">
        <span className="sx-by"><span className="brain b-builder"><img src="/brand/brains/builder.png" alt="" /></span>{t('site.by')}</span>
        <div className="row between g12">
          <h2 className="h3" id="sp-title" style={{ margin: 0 }}>{t('site.title')}</h2>
          {list.length > 0 && <span className="spanel-pct" aria-label={`${total}% ${t('site.pct')}`}><b>{total}</b>%</span>}
        </div>
        {list.length > 0 && <div className="sx-bar" aria-hidden="true">{counts.map(([s, n]) => <span key={s} className={`is-${s}`} style={{ flexGrow: n }} />)}</div>}
      </header>

      <AskAdjustment brandId={brandId} url={url} />

      {list.length === 0 ? <p className="t-sm t-mute" style={{ margin: 0 }}>{t('sp.empty')}</p> : (
        <div className="col g8">
          {open.length > 0 && <p className="label" style={{ margin: 0 }}>{t('sp.open', { n: open.length })}</p>}
          {open.map((x) => <Point key={x.id} x={x} />)}
          {done.length > 0 && (
            <details className="spanel-done">
              <summary className="label">{t('sp.done', { n: done.length })}</summary>
              <div className="col g8">{done.map((x) => <Point key={x.id} x={x} />)}</div>
            </details>
          )}
        </div>
      )}
    </aside>
  );
}

/** One triage point, folded to its title and state; opens to what was asked and what was done. */
function Point({ x }: { x: SiteChange }) {
  const { t } = useI18n();
  return (
    <details className={`spanel-pt is-${x.status}`}>
      <summary>
        <span className="sx-key">{x.key}</span>
        <span className="spanel-ptitle">{x.title}</span>
        <span className={`sx-status is-${x.status}`}>{t(`site.status.${x.status}` as StringKey)}</span>
      </summary>
      {x.request && <p className="t-xs"><span className="sx-lbl">{t('site.asked')}</span> {x.request}</p>}
      {x.delivered && <p className="t-xs"><span className="sx-lbl">{t('site.done')}</span> {x.delivered}</p>}
      {x.link && <a className="sx-link t-xs" href={x.link} target="_blank" rel="noreferrer">{t('site.seeChange')} ↗</a>}
    </details>
  );
}

/** Ask for one more adjustment: a web request routed to Builder, with the site's address attached. */
function AskAdjustment({ brandId, url }: { brandId: string; url: string }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setBusy(true); setError(false);
    try {
      const { requestId } = await createRequest(brandId, {
        category: 'web', title: `${t('sp.reqTitle')}: ${v.split('\n')[0].slice(0, 70)}`,
        cards: { product: { text: v, links: [url], files: [] } },
      });
      setSent(requestId); setText('');
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <form className="spanel-ask col g8" onSubmit={send}>
      <label htmlFor="sp-ask" className="w7 t-sm">{t('sp.ask')}</label>
      <textarea id="sp-ask" className="input" rows={3} value={text} maxLength={4000} placeholder={t('sp.askPh')}
        onChange={(e) => { setText(e.target.value); setSent(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e); }} />
      <div className="row between g8 wrap">
        <span className="t-xs t-mute">{t('sp.askHelp')}</span>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{busy ? `${t('sp.sending')}…` : t('sp.send')}</button>
      </div>
      {error && <p className="help err" role="alert" style={{ margin: 0 }}>{t('sp.error')}</p>}
      {sent && <p className="t-xs" role="status" style={{ margin: 0 }}>✓ {t('sp.sent')} <Link to={`/requests/${sent}`}>{t('sp.seeRequest')}</Link></p>}
    </form>
  );
}
