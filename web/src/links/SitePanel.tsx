import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { createRequest } from '../requests/api';
import { pct, pointsFor, STATUSES, useSiteChanges, type SiteChange } from './SiteChanges';
import type { BrandLink } from './useBrandLinks';
import type { SiteFrame, Spot } from './useSpot';
import { SiteComments, useSiteComments } from './SiteComments';

/**
 * The narrow column beside the site in the viewer: the site's adjustments triage at a glance
 * (open points first, delivered folded) and a box to ask for one more adjustment, which becomes a web request;
 * a second tab holds the comments pinned on the site.
 */
export function SitePanel({ brandId, link, links, frame }: { brandId: string; link: BrandLink; links: BrandLink[]; frame?: SiteFrame }) {
  const { t } = useI18n();
  const onShow = frame?.go, active = frame?.active;
  const comments = useSiteComments(brandId, link.url);
  const openComments = comments.filter((c) => !c.resolved).length;
  const [tab, setTab] = useState<'changes' | 'comments'>('changes');
  // A pin clicked on the site, or comment mode turned on, brings the comments tab forward.
  useEffect(() => { if (frame?.pinned || frame?.picking) setTab('comments'); }, [frame?.pinned, frame?.picking]);
  const list = pointsFor(useSiteChanges(brandId), link, links);
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

      <div className="seg sc-tabs" role="tablist" aria-label={t('site.title')}>
        <button type="button" role="tab" aria-selected={tab === 'changes'} className={tab === 'changes' ? 'is-on' : ''} onClick={() => setTab('changes')}>{t('sc.tabChanges')}</button>
        <button type="button" role="tab" aria-selected={tab === 'comments'} className={tab === 'comments' ? 'is-on' : ''} onClick={() => setTab('comments')}>{t('sc.tabComments')}{openComments ? ` (${openComments})` : ''}</button>
      </div>

      {tab === 'comments' ? <SiteComments brandId={brandId} list={comments} frame={frame} /> : <>
      <AskAdjustment brandId={brandId} url={link.url} />

      {list.length === 0 ? <p className="t-sm t-mute" style={{ margin: 0 }}>{t('sp.empty')}</p> : (
        <div className="col g8">
          {open.length > 0 && <p className="label" style={{ margin: 0 }}>{t('sp.open', { n: open.length })}</p>}
          {open.map((x) => <Point key={x.id} brandId={brandId} x={x} onShow={onShow} on={active === x.key} />)}
          {done.length > 0 && (
            <details className="spanel-done">
              <summary className="label">{t('sp.done', { n: done.length })}</summary>
              <div className="col g8">{done.map((x) => <Point key={x.id} brandId={brandId} x={x} onShow={onShow} on={active === x.key} />)}</div>
            </details>
          )}
        </div>
      )}
      </>}
    </aside>
  );
}

/** One triage point, folded to its title and state; opens to what was asked and what was done. NickMark changes the state here. */
function Point({ brandId, x, onShow, on }: { brandId: string; x: SiteChange; onShow?: (s: Spot) => void; on?: boolean }) {
  const { t } = useI18n();
  const isAdmin = useAuth().profile?.role === 'admin';
  return (
    // Opening a point takes the site beside it to where the point lives.
    <details className={`spanel-pt is-${x.status}${on ? ' is-on' : ''}`}
      onToggle={(e) => { if (e.currentTarget.open && onShow && (x.link || x.spot)) onShow({ url: x.link, spot: x.spot, label: x.key, auto: true }); }}>
      <summary>
        <span className="sx-key">{x.key}</span>
        <span className="spanel-ptitle">{x.title}</span>
        <span className={`sx-status is-${x.status}`}>{t(`site.status.${x.status}` as StringKey)}</span>
      </summary>
      {isAdmin && (
        <select className={`sx-status spanel-set is-${x.status}`} aria-label={`${t('site.state')} ${x.key}`} value={x.status}
          onChange={(e) => updateDoc(doc(db, 'brands', brandId, 'siteChanges', x.id), { status: e.target.value, updatedAt: serverTimestamp() })}>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`site.status.${s}` as StringKey)}</option>)}
        </select>
      )}
      {x.request && <p className="t-xs"><span className="sx-lbl">{t('site.asked')}</span> {x.request}</p>}
      {x.delivered && <p className="t-xs"><span className="sx-lbl">{t('site.done')}</span> {x.delivered}</p>}
      {onShow && (x.link || x.spot)
        ? <button type="button" className="sx-link t-xs" onClick={() => onShow({ url: x.link, spot: x.spot, label: x.key })}>{t('sp.showOnPage')}</button>
        : x.link && <a className="sx-link t-xs" href={x.link} target="_blank" rel="noreferrer">{t('site.seeChange')} ↗</a>}
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
